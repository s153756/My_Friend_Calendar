import uuid
from sqlalchemy import Index
from sqlalchemy.dialects.postgresql import UUID, INET
from app.extensions import db


class UserSession(db.Model):
    __tablename__ = "user_sessions"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_name = db.Column(db.String(100))
    ip_address = db.Column(INET)
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())
    last_seen_at = db.Column(db.DateTime(timezone=True))
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    revoked_at = db.Column(db.DateTime(timezone=True))

    user = db.relationship("User", back_populates="sessions")

    __table_args__ = (
        Index("ix_user_sessions_user_id", "user_id"),
    )
