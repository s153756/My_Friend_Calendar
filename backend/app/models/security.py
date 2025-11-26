import uuid
from sqlalchemy import CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, CITEXT, INET
from app.extensions import db


class LoginAttempt(db.Model):
    __tablename__ = "login_attempts"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="SET NULL"))
    email = db.Column(CITEXT)
    ip_address = db.Column(INET)
    user_agent = db.Column(db.Text)
    successful = db.Column(db.Boolean, nullable=False)
    failure_reason = db.Column(db.String(64))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())

    user = db.relationship("User", back_populates="login_attempts")

    __table_args__ = (
        Index("ix_login_attempts_user_id_created_at", "user_id", "created_at"),
        Index("ix_login_attempts_email_created_at", "email", "created_at"),
        Index("ix_login_attempts_ip_created_at", "ip_address", "created_at"),
    )


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    used_at = db.Column(db.DateTime(timezone=True))

    user = db.relationship("User", back_populates="password_reset_tokens")

    __table_args__ = (
        CheckConstraint("expires_at > created_at", name="ck_password_reset_tokens_expiry"),
        Index("ux_password_reset_token_hash", "token_hash", unique=True),
    )
