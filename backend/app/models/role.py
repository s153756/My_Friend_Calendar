from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.SmallInteger, primary_key=True)
    name = db.Column(db.String(64), nullable=False, unique=True)

    users = db.relationship("User", secondary="user_roles", back_populates="roles")


class UserRole(db.Model):
    __tablename__ = "user_roles"

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id = db.Column(db.SmallInteger, db.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
