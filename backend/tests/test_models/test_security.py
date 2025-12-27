import pytest
from datetime import datetime, timedelta, timezone
from app.models import LoginAttempt, PasswordResetToken
from uuid import UUID
from sqlalchemy.exc import IntegrityError

class TestLoginAttempt:
    def test_create_successful_login(self, session, user):
        attempt = LoginAttempt(
            user_id=user.id,
            email=user.email,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0 (Test)",
            successful=True,
            failure_reason=None,
        )
        session.add(attempt)
        session.flush()
        session.refresh(attempt)

        assert attempt.id is not None
        assert attempt.user_id == user.id
        assert attempt.successful is True
        assert attempt.failure_reason is None
        assert isinstance(attempt.created_at, datetime)

    def test_create_failed_login(self, session, user):
        attempt = LoginAttempt(
            user_id=user.id,
            email="wrong@example.com",
            ip_address="10.0.0.1",
            user_agent="TestAgent",
            successful=False,
            failure_reason="invalid_credentials",
        )
        session.add(attempt)
        session.flush()
        session.refresh(attempt)

        assert attempt.successful is False
        assert attempt.failure_reason == "invalid_credentials"

    def test_nullable_fields(self, session):
        attempt = LoginAttempt(
            successful=True,
            email=None,
            ip_address=None,
            user_agent=None,
            failure_reason=None,
        )
        session.add(attempt)
        session.flush()

class TestPasswordResetToken:
    def test_create_valid_token(self, session, user):
        now = datetime.now(timezone.utc)
        token = PasswordResetToken(
            user_id=user.id,
            token_hash="fakehash123",
            created_at=now,
            expires_at=now + timedelta(hours=1),
            used_at=None,
        )
        session.add(token)
        session.flush()
        session.refresh(token)

        assert isinstance(token.id, UUID)
        assert token.user_id == user.id
        assert token.token_hash == "fakehash123"
        assert token.expires_at > token.created_at
        assert token.used_at is None

    def test_expiry_check_constraint(self, session, user):
        now = datetime.now(timezone.utc)
        token = PasswordResetToken(
            user_id=user.id,
            token_hash="fakehash",
            created_at=now,
            expires_at=now - timedelta(minutes=1),
        )
        session.add(token)
        with pytest.raises(IntegrityError):
            session.flush()

    def test_unique_token_hash_constraint(self, session, user):
        now = datetime.now(timezone.utc)
        token1 = PasswordResetToken(
            user_id=user.id,
            token_hash="samehash",
            created_at=now,
            expires_at=now + timedelta(hours=1),
        )
        token2 = PasswordResetToken(
            user_id=user.id,
            token_hash="samehash",
            created_at=now,
            expires_at=now + timedelta(hours=1),
        )
        session.add(token1)
        session.flush()
        session.add(token2)
        with pytest.raises(IntegrityError):
            session.flush()