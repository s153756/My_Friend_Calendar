import pytest
from datetime import datetime, timedelta, timezone
from uuid import UUID
from app.models import UserSession
from sqlalchemy.exc import IntegrityError


class TestUserSession:
    def _utcnow(self):
        return datetime.now(timezone.utc)

    def test_create_valid_session(self, session, user):
        """Test creating a valid user session."""
        now = self._utcnow()
        session_obj = UserSession(
            user_id=user.id,
            device_name="iPhone 14 Pro",
            ip_address="192.168.1.100",
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
            created_at=now,
            last_seen_at=now,
            expires_at=now + timedelta(days=7),
            revoked_at=None,
        )
        session.add(session_obj)
        session.flush()
        session.refresh(session_obj)

        assert isinstance(session_obj.id, UUID)
        assert session_obj.user_id == user.id
        assert session_obj.device_name == "iPhone 14 Pro"
        assert session_obj.ip_address == "192.168.1.100"
        assert session_obj.user_agent.startswith("Mozilla/5.0")
        assert session_obj.created_at == now
        assert session_obj.last_seen_at == now
        assert session_obj.expires_at > now
        assert session_obj.revoked_at is None

    def test_nullable_fields(self, session, user):
        """Test that optional fields can be None."""
        now = self._utcnow()
        session_obj = UserSession(
            user_id=user.id,
            device_name=None,
            ip_address=None,
            user_agent=None,
            created_at=now,
            last_seen_at=None,
            expires_at=now + timedelta(hours=24),
            revoked_at=None,
        )
        session.add(session_obj)
        session.flush()

    def test_expires_at_required(self, session, user):
        """Test that expires_at is NOT nullable (should raise IntegrityError)."""
        now = self._utcnow()
        session_obj = UserSession(
            user_id=user.id,
            created_at=now,
            expires_at=None,
        )
        session.add(session_obj)
        with pytest.raises(IntegrityError):
            session.flush()

    def test_cascade_delete_on_user(self, session, user):
        """Test that deleting the user also deletes associated sessions (CASCADE)."""
        now = self._utcnow()
        session_obj = UserSession(
            user_id=user.id,
            created_at=now,
            expires_at=now + timedelta(days=30),
        )
        session.add(session_obj)
        session.flush()

        session.delete(user)
        session.flush()

        assert session.query(UserSession).filter_by(id=session_obj.id).first() is None

    def test_relationship_back_populates(self, session, user):
        """Test the relationship between User and UserSession."""
        now = self._utcnow()
        session_obj = UserSession(
            user_id=user.id,
            created_at=now,
            expires_at=now + timedelta(days=7),
        )
        session.add(session_obj)
        session.flush()

        assert session_obj.user == user

        assert session_obj in user.sessions

    def test_index_is_created(self, session, user):
        """Basic test to ensure table creation with index succeeds."""
        now = self._utcnow()
        session_obj = UserSession(
            user_id=user.id,
            created_at=now,
            expires_at=now + timedelta(days=1),
        )
        session.add(session_obj)
        session.flush()