import pytest
from sqlalchemy.exc import IntegrityError, DataError
from app.models import Role, UserRole, User
from werkzeug.security import generate_password_hash


@pytest.fixture
def admin_role(session):
    """Create an admin role."""
    role = Role(name="admin")
    session.add(role)
    session.flush()
    session.refresh(role)
    return role


@pytest.fixture
def user_role_fixture(session):
    """Create a user role."""
    role = Role(name="user")
    session.add(role)
    session.flush()
    session.refresh(role)
    return role


@pytest.fixture
def moderator_role(session):
    """Create a moderator role."""
    role = Role(name="moderator")
    session.add(role)
    session.flush()
    session.refresh(role)
    return role


@pytest.fixture
def second_user(session):
    """Create a second test user."""
    new_user = User()
    new_user.email = "second@example.com"
    new_user.password_hash = generate_password_hash("demo456")
    new_user.password_algorithm = "pbkdf2:sha256"
    new_user.is_email_verified = True
    new_user.is_active = True
    session.add(new_user)
    session.flush()
    session.refresh(new_user)
    return new_user


class TestRoleModel:
    """Test cases for the Role model."""

    def test_create_role(self, session):
        """Test creating a role."""
        role = Role(name="editor")
        session.add(role)
        session.flush()

        assert role.id is not None
        assert role.name == "editor"

    def test_role_name_required(self, session):
        """Test that role name is required."""
        role = Role(name=None)
        session.add(role)

        with pytest.raises(IntegrityError):
            session.flush()

    def test_role_name_unique(self, session, admin_role):
        """Test that role names must be unique."""
        duplicate_role = Role(name="admin")
        session.add(duplicate_role)

        with pytest.raises(IntegrityError):
            session.flush()

    def test_role_max_length(self, session):
        """Test role name length constraint."""
        # Create a name longer than 64 characters
        long_name = "a" * 65
        role = Role(name=long_name)
        session.add(role)

        with pytest.raises(DataError):
            session.flush()

    def test_role_users_relationship(self, session, admin_role, user):
        """Test role-user relationship initialization."""
        assert hasattr(admin_role, 'users')
        assert isinstance(admin_role.users, list)
        assert len(admin_role.users) == 0

    def test_retrieve_role_by_name(self, session, admin_role):
        """Test querying role by name."""
        retrieved_role = session.query(Role).filter_by(name="admin").first()

        assert retrieved_role is not None
        assert retrieved_role.id == admin_role.id
        assert retrieved_role.name == "admin"

    def test_retrieve_all_roles(self, session, admin_role, user_role_fixture, moderator_role):
        """Test retrieving all roles."""
        roles = session.query(Role).all()

        assert len(roles) == 3
        role_names = [role.name for role in roles]
        assert "admin" in role_names
        assert "user" in role_names
        assert "moderator" in role_names

    def test_update_role_name(self, session, admin_role):
        """Test updating a role name."""
        admin_role.name = "super_admin"
        session.flush()

        updated_role = session.query(Role).filter_by(id=admin_role.id).first()
        assert updated_role.name == "super_admin"

    def test_delete_role(self, session):
        """Test deleting a role without associations."""
        role = Role(name="temporary")
        session.add(role)
        session.flush()
        role_id = role.id

        session.delete(role)
        session.flush()

        deleted_role = session.query(Role).filter_by(id=role_id).first()
        assert deleted_role is None


class TestUserRoleModel:
    """Test cases for the UserRole association model."""

    def test_create_user_role_association(self, session, user, admin_role):
        """Test creating a user-role association."""
        user_role = UserRole(user_id=user.id, role_id=admin_role.id)
        session.add(user_role)
        session.flush()

        # Verify the association exists
        association = session.query(UserRole).filter_by(
            user_id=user.id,
            role_id=admin_role.id
        ).first()

        assert association is not None
        assert association.user_id == user.id
        assert association.role_id == admin_role.id

    def test_multiple_roles_per_user(self, session, user, admin_role, user_role_fixture, moderator_role):
        """Test that a user can have multiple roles."""
        user_role_1 = UserRole(user_id=user.id, role_id=admin_role.id)
        user_role_2 = UserRole(user_id=user.id, role_id=user_role_fixture.id)
        user_role_3 = UserRole(user_id=user.id, role_id=moderator_role.id)

        session.add_all([user_role_1, user_role_2, user_role_3])
        session.flush()

        user_roles = session.query(UserRole).filter_by(user_id=user.id).all()
        assert len(user_roles) == 3

    def test_multiple_users_per_role(self, session, user, second_user, admin_role):
        """Test that a role can be assigned to multiple users."""
        user_role_1 = UserRole(user_id=user.id, role_id=admin_role.id)
        user_role_2 = UserRole(user_id=second_user.id, role_id=admin_role.id)

        session.add_all([user_role_1, user_role_2])
        session.flush()

        role_users = session.query(UserRole).filter_by(role_id=admin_role.id).all()
        assert len(role_users) == 2

    def test_cascade_delete_user(self, session, user, admin_role):
        """Test that deleting a user cascades to user_roles."""
        user_role = UserRole(user_id=user.id, role_id=admin_role.id)
        session.add(user_role)
        session.flush()

        # Verify association exists
        association = session.query(UserRole).filter_by(user_id=user.id).first()
        assert association is not None

        # Delete user
        session.delete(user)
        session.flush()

        # Verify association is deleted
        association = session.query(UserRole).filter_by(user_id=user.id).first()
        assert association is None

        # Verify role still exists
        role = session.query(Role).filter_by(id=admin_role.id).first()
        assert role is not None

    def test_cascade_delete_role(self, session, user, admin_role):
        """Test that deleting a role cascades to user_roles."""
        user_role = UserRole(user_id=user.id, role_id=admin_role.id)
        session.add(user_role)
        session.flush()
        role_id = admin_role.id

        # Verify association exists
        association = session.query(UserRole).filter_by(role_id=role_id).first()
        assert association is not None

        # Delete role
        session.delete(admin_role)
        session.flush()

        # Verify association is deleted
        association = session.query(UserRole).filter_by(role_id=role_id).first()
        assert association is None

        # Verify user still exists
        user_obj = session.query(User).filter_by(id=user.id).first()
        assert user_obj is not None

    def test_invalid_user_id_foreign_key(self, session, admin_role):
        """Test that invalid user_id violates foreign key constraint."""
        import uuid
        fake_user_id = uuid.uuid4()

        user_role = UserRole(user_id=fake_user_id, role_id=admin_role.id)
        session.add(user_role)

        with pytest.raises(IntegrityError):
            session.flush()

    def test_invalid_role_id_foreign_key(self, session, user):
        """Test that invalid role_id violates foreign key constraint."""
        fake_role_id = 99999

        user_role = UserRole(user_id=user.id, role_id=fake_role_id)
        session.add(user_role)

        with pytest.raises(DataError):
            session.flush()


class TestRoleUserRelationship:
    """Test cases for the many-to-many relationship between Role and User."""

    def test_assign_role_via_relationship(self, session, user, admin_role):
        """Test assigning a role to a user via the relationship."""
        admin_role.users.append(user)
        session.flush()

        # Verify through relationship
        session.refresh(admin_role)
        session.refresh(user)
        assert user in admin_role.users
        assert admin_role in user.roles

    def test_remove_role_via_relationship(self, session, user, admin_role):
        """Test removing a role from a user via the relationship."""
        admin_role.users.append(user)
        session.flush()

        admin_role.users.remove(user)
        session.flush()

        session.refresh(admin_role)
        session.refresh(user)
        assert user not in admin_role.users
        assert admin_role not in user.roles

    def test_query_users_by_role(self, session, user, second_user, admin_role):
        """Test querying users by their role."""
        admin_role.users.extend([user, second_user])
        session.flush()

        session.refresh(admin_role)
        assert len(admin_role.users) == 2
        user_emails = [u.email for u in admin_role.users]
        assert "test@example.com" in user_emails
        assert "second@example.com" in user_emails

    def test_query_roles_by_user(self, session, user, admin_role, user_role_fixture):
        """Test querying roles for a specific user."""
        user.roles.extend([admin_role, user_role_fixture])
        session.flush()

        session.refresh(user)
        assert len(user.roles) == 2
        role_names = [r.name for r in user.roles]
        assert "admin" in role_names
        assert "user" in role_names

    def test_check_user_has_role(self, session, user, admin_role, user_role_fixture):
        """Test checking if a user has a specific role."""
        user.roles.append(admin_role)
        session.flush()

        session.refresh(user)

        # Check if user has admin role
        has_admin = any(role.name == "admin" for role in user.roles)
        has_user = any(role.name == "user" for role in user.roles)

        assert has_admin is True
        assert has_user is False

    def test_count_users_with_role(self, session, user, second_user, admin_role):
        """Test counting users with a specific role."""
        admin_role.users.extend([user, second_user])
        session.flush()

        user_count = session.query(UserRole).filter_by(role_id=admin_role.id).count()
        assert user_count == 2

    def test_count_roles_for_user(self, session, user, admin_role, user_role_fixture, moderator_role):
        """Test counting roles assigned to a user."""
        user.roles.extend([admin_role, user_role_fixture, moderator_role])
        session.flush()

        role_count = session.query(UserRole).filter_by(user_id=user.id).count()
        assert role_count == 3