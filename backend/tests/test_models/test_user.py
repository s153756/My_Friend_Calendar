import pytest
from sqlalchemy.exc import IntegrityError
from app.models import User, UserProfile, UserSettings

def test_new_user_defaults(session):
    """Test that a user is created with correct defaults."""
    user = User(
        email="testdefaults@example.com",
        password_hash="a-very-long-valid-password-hash"
    )
    session.add(user)
    session.flush()

    assert user.id is not None
    assert user.password_algorithm == "argon2id"
    assert user.is_active is True
    assert user.is_email_verified is False
    assert user.created_at is not None

def test_user_email_constraint(session):
    """Test the email length check constraint."""
    long_email = "a" * 311 + "@example.com" # > 320 chars
    user = User(email=long_email, password_hash="valid_hash_length_here")
    session.add(user)

    with pytest.raises(IntegrityError):
        session.flush()

def test_user_profile_relationship(session):
    """Test the one-to-one relationship with UserProfile."""
    user = User(email="profile@test.com", password_hash="valid_hash_length_here")
    profile = UserProfile(user=user, display_name="Tester")

    session.add(user)
    session.flush()

    assert user.profile.display_name == "Tester"
    assert profile.user_id == user.id

def test_user_settings_constraints(session):
    """Test the check constraints on the UserSettings model."""
    user = User(email="settings@test.com", password_hash="valid_hash_length_here")
    session.add(user)
    session.flush()

    # Invalid week_starts_on (must be 0-6)
    invalid_settings = UserSettings(user_id=user.id, week_starts_on=7)
    session.add(invalid_settings)

    with pytest.raises(IntegrityError):
        session.flush()

    session.rollback()

    # Invalid default_view
    invalid_view = UserSettings(user_id=user.id, default_view="year")
    session.add(invalid_view)

    with pytest.raises(IntegrityError):
        session.flush()

def test_cascade_delete(session):
    """Verify that deleting a user deletes their profile and settings."""
    user = User(email="delete@test.com", password_hash="valid_hash_length_here")
    profile = UserProfile(user=user)
    settings = UserSettings(user=user)

    session.add_all([user, profile, settings])
    session.flush()

    session.delete(user)
    session.flush()

    assert session.query(UserProfile).filter_by(user_id=user.id).first() is None
    assert session.query(UserSettings).filter_by(user_id=user.id).first() is None

def test_unique_email_active_index(session):
    """Test the partial unique index (active users must have unique emails)."""
    email = "unique@test.com"
    u1 = User(email=email, password_hash="valid_hash_length_here")
    session.add(u1)
    session.flush()

    u2 = User(email=email, password_hash="another_valid_hash_here")
    session.add(u2)

    with pytest.raises(IntegrityError):
        session.flush()