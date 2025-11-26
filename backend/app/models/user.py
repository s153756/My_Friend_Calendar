import uuid
from sqlalchemy import CheckConstraint, Index, text
from sqlalchemy.dialects.postgresql import UUID, CITEXT
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(CITEXT, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    password_algorithm = db.Column(db.String(32), nullable=False, default="argon2id")
    is_email_verified = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, server_default=db.func.now(), onupdate=db.func.now()
    )
    last_login_at = db.Column(db.DateTime(timezone=True))
    deleted_at = db.Column(db.DateTime(timezone=True))

    profile = db.relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    roles = db.relationship("Role", secondary="user_roles", back_populates="users")
    sessions = db.relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    login_attempts = db.relationship("LoginAttempt", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = db.relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan"
    )
    settings = db.relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("length(email) <= 320", name="ck_users_email_length"),
        CheckConstraint("length(password_hash) >= 20", name="ck_users_password_hash_length"),
        Index(
            "ux_users_email_active",
            "email",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )


class UserProfile(db.Model):
    __tablename__ = "user_profiles"

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    display_name = db.Column(db.String(100))
    full_name = db.Column(db.String(200))
    timezone = db.Column(db.String(64))
    locale = db.Column(db.String(16))

    user = db.relationship("User", back_populates="profile")


class UserSettings(db.Model):
    __tablename__ = "user_settings"

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    week_starts_on = db.Column(db.SmallInteger, nullable=False, default=1)
    default_view = db.Column(db.String(16), nullable=False, default="month")
    time_format = db.Column(db.String(8), nullable=False, default="24h")
    notifications_email = db.Column(db.Boolean, nullable=False, default=True)
    notifications_push = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, server_default=db.func.now(), onupdate=db.func.now()
    )

    user = db.relationship("User", back_populates="settings")

    __table_args__ = (
        CheckConstraint("week_starts_on BETWEEN 0 AND 6", name="ck_user_settings_week_start"),
        CheckConstraint("default_view IN ('day','week','month')", name="ck_user_settings_default_view"),
        CheckConstraint("time_format IN ('24h','12h')", name="ck_user_settings_time_format"),
    )
