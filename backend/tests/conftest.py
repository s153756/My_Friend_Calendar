import pytest
import os
from run import create_app
from app.extensions import db as _db
from app.models import User
from werkzeug.security import generate_password_hash

@pytest.fixture(scope='session')
def app():
    """Create application for testing."""

    if 'DATABASE_URL' not in os.environ:
        os.environ['DATABASE_URL'] = 'postgresql://postgres:password@db:5432/testdb'
    os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
    app = create_app()
    app.config['TESTING'] = True
   
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()

@pytest.fixture(scope='function')
def session(app):
    """Create a fresh database session for each test."""
    with app.app_context():
        # Start a nested transaction
        connection = _db.engine.connect()
        transaction = connection.begin()
        
        # Override the session to use this connection
        session_options = dict(bind=connection, binds={})
        session = _db._make_scoped_session(options=session_options)
        
        # Replace the db.session with our test session
        _db.session = session
        
        yield session
        
        # Rollback the transaction and close
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture
def user(session):
    """Create a test user."""
    
    new_user = User()
    new_user.email = "test@example.com"
    new_user.password_hash = generate_password_hash("demo123")
    new_user.password_algorithm = "pbkdf2:sha256"
    new_user.is_email_verified = True
    new_user.is_active = True

    session.add(new_user)
    session.commit()
    session.refresh(new_user)  # Refresh to ensure we have the ID
    return new_user
