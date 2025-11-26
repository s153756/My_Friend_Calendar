from typing import Optional

from werkzeug.security import check_password_hash
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.extensions import db
from app.models import User

_password_hasher = PasswordHasher()


def _verify_password(user: User, password: str) -> bool:
    if not user.password_hash:
        return False

    algorithm = user.password_algorithm or "pbkdf2:sha256"

    if algorithm.startswith("pbkdf2"):
        return check_password_hash(user.password_hash, password)

    if algorithm == "argon2id":
        try:
            _password_hasher.verify(user.password_hash, password)
            return True
        except VerifyMismatchError:
            return False
        except Exception:
            return False

    return False


def authenticate_user(email: str, password: str) -> Optional[User]:
    normalized_email = (email or "").strip().lower()
    if not normalized_email or not password:
        return None

    query = User.query
    if hasattr(User, "deleted_at"):
        query = query.filter(User.deleted_at.is_(None))

    user = query.filter_by(email=normalized_email).first()
    if not user:
        return None

    if hasattr(User, "is_active") and not user.is_active:
        return None

    if not _verify_password(user, password):
        return None

    try:
        user.last_login_at = db.func.now()
        db.session.add(user)
        db.session.commit()
    except Exception:
        db.session.rollback()

    return user
