from typing import Optional
import re
from werkzeug.security import check_password_hash
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.security import generate_password_hash
from app.extensions import db
from app.models import User, UserSession, UserProfile, UserSettings, PasswordResetToken
from datetime import datetime, timedelta, timezone
import uuid
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token
from flask_mail import Message
from app.extensions import mail
import secrets
import hashlib

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

MINIMAL_PASSWORD_LENGTH = 8
MAXIMAL_PASSWORD_LENGTH = 64
PASSWORD_ERRORS_DETAILS = {
    'too_short_error': f"Password must be at least {MINIMAL_PASSWORD_LENGTH} characters long.",
    'too_long_error': f"Password cannot exceed {MAXIMAL_PASSWORD_LENGTH} characters.",
    'digit_error': "Password must contain at least one digit.",
    'uppercase_error': "Password must contain at least one uppercase letter.",
    'lowercase_error': "Password must contain at least one lowercase letter.",
    'symbol_error': "Password must contain at least one special character (e.g., !, @, #, $, %).",
}

def validate_password(password):
    errors = {
        'too_short_error': len(password) < MINIMAL_PASSWORD_LENGTH,
        'too_long_error': len(password) > MAXIMAL_PASSWORD_LENGTH,
        'digit_error': re.search(r"\d", password) is None,
        'uppercase_error': re.search(r"[A-Z]", password) is None,
        'lowercase_error': re.search(r"[a-z]", password) is None,
        'symbol_error': re.search(r"[@!#$%&'()*+,-./[\\\]^_`{|}~" + r'"]', password) is None,
    }
    active_errors_messages = [
        PASSWORD_ERRORS_DETAILS[key] for key, has_error in errors.items() if has_error
    ]

    return {
        'password_ok': not any(errors.values()),
        'errors': errors,
        'messages': active_errors_messages
    }

MINIMAL_EMAIL_LENGTH = 5
MAXIMAL_EMAIL_LENGTH = 254
EMAIL_ERRORS_DETAILS = {
    'too_short_error': f"Email must be at least {MINIMAL_EMAIL_LENGTH} characters long.",
    'too_long_error': f"Email cannot exceed {MAXIMAL_EMAIL_LENGTH} characters.",
    'invalid_format_error': "Email must be a valid email address.",
}

def validate_email(email):
    errors = {
        'too_short_error': len(email) < MINIMAL_EMAIL_LENGTH,
        'too_long_error': len(email) > MAXIMAL_EMAIL_LENGTH,
        'invalid_format_error': re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) is None,
    }
    active_errors_messages = [
        EMAIL_ERRORS_DETAILS[key] for key, has_error in errors.items() if has_error
    ]

    return {
        'email_ok': not any(errors.values()),
        'errors': errors,
        'messages': active_errors_messages
    }

def create_user(data):
    """
    Create a new user.
    """
    existing_user = User.query.filter_by(email=data["email"]).first()
    if existing_user:
        return None, ["User with this email already exists"]

    try:
        new_user = User()
        email = data.get("email", "").lower().strip()
        new_user.email = email
        new_user.password_hash = generate_password_hash(data['password'])
        new_user.password_algorithm = "pbkdf2:sha256"
        new_user.is_email_verified = False
        new_user.is_active = True
        new_user.created_at = datetime.now(timezone.utc)
        db.session.add(new_user)
        db.session.flush()

        profile = UserProfile()
        profile.user_id = new_user.id
        profile.display_name = data["display_name"]
        profile.full_name = data["full_name"]
        profile.timezone = "Europe/Warsaw"
        profile.locale = "pl_PL"

        settings = UserSettings()
        settings.user_id = new_user.id
        settings.week_starts_on = 1
        settings.default_view = "month"
        settings.time_format = "24h"
        settings.notifications_email = True
        settings.notifications_push = True

        db.session.add(profile)
        db.session.add(settings)
        db.session.commit()

        return new_user, []

    except Exception as e:
        db.session.rollback()
        return None, [str(e)]

class SessionNotFoundError(Exception):
    pass

class SessionRevokedError(Exception):
    pass

def refresh_tokens(self, jti_string, user_id, ip_address, user_agent):

    jti_uuid = uuid.UUID(jti_string)
    old_session = UserSession.query.get(jti_uuid)

    if not old_session:
        raise SessionNotFoundError("Session not found")

    if old_session.revoked_at:
        raise SessionRevokedError("Session already revoked")

    new_access_token = create_access_token(identity=user_id)
    new_refresh_token = create_refresh_token(identity=user_id)
    new_jti_string = decode_token(new_refresh_token)['jti']

    old_session.revoked_at = datetime.utcnow()

    new_session = UserSession(
        id=uuid.UUID(new_jti_string),
        user_id=user_id,
        device_name=old_session.device_name,
        ip_address=ip_address,
        user_agent=user_agent,
        expires_at=datetime.utcnow() + timedelta(days=30),
        last_seen_at=datetime.utcnow()
    )

    db.session.add(new_session)
    db.session.commit()

    return {
        'access_token': new_access_token,
        'refresh_token': new_refresh_token
    }


def revoke_session(jti_uuid):
    session = UserSession.query.get(jti_uuid)
    if session:
        session.revoked_at = datetime.utcnow()
        db.session.commit()


def generate_session_for_user(user_id, user_agent, remote_addr):
    access_token = create_access_token(identity=user_id)
    refresh_token = create_refresh_token(identity=user_id)

    jti_string = decode_token(refresh_token)['jti']

    session = UserSession(
        id=uuid.UUID(jti_string),
        user_id=user_id,
        device_name=str(user_agent),
        ip_address=remote_addr,
        user_agent=str(user_agent),
        expires_at=datetime.utcnow() + timedelta(days=30),
        last_seen_at=datetime.utcnow()
    )

    db.session.add(session)
    db.session.commit()

    return {
        'access_token': access_token,
        'refresh_token': refresh_token
    }


def generate_reset_password_token(email, ip_address, user_agent):
    """
    Generate a reset token, hash it, and save it to the database for a specific user.

    :param email: The email of the user.
    :param ip_address: The IP address of the request.
    :param user_agent: The user agent of the request.
    :return: The reset link or an error message.
    """
    normalized_email = (email or "").strip().lower()
    if not normalized_email:
        return "Invalid email provided."

    user = User.query.filter_by(email=normalized_email).first()

    if not user:
        return f"User with email {email} does not exist."

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    created_at = datetime.now(timezone.utc)
    expires_at = created_at + timedelta(hours=1)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        created_at=created_at,
        expires_at=expires_at
    )

    db.session.add(reset_token)
    db.session.commit()

    # Generowanie linku do resetu hasła
    reset_link = f"http://localhost:3000/reset-password?token={token}"

    return {
        'reset_link': reset_link,
        'user_id': user.id,
        'ip_address': ip_address,
        'user_agent': user_agent
    }

def send_reset_password_email(email, reset_link):
    """
    Send a password reset email to the user.

    :param email: The email of the user.
    :param reset_link: The reset link containing the token.
    """
    subject = "Password Reset Request"
    body = f"Click the link below to reset your password:\n\n{reset_link}\n\nIf you did not request a password reset, please ignore this email."

    msg = Message(subject=subject, recipients=[email], body=body)
    mail.send(msg)

class TokenError(Exception):
    """Base exception for token errors"""
    pass

class TokenNotFoundException(TokenError):
    """Token not found in database"""
    pass

class TokenExpiredException(TokenError):
    """Token has expired"""
    pass

class TokenAlreadyUsedException(TokenError):
    """Token has already been used"""
    pass

def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()

def reset_password(token, password):
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    reset_token = PasswordResetToken.query.filter_by(
        token_hash=token_hash
    ).first()

    if not reset_token:
        raise TokenNotFoundException("Token not found")

    if reset_token.used_at is not None:
        raise TokenAlreadyUsedException("Token already used")

    if reset_token.expires_at < datetime.now(timezone.utc):
        raise TokenExpiredException("Token expired")

    try:
        reset_token.used_at = datetime.now(timezone.utc)

        user = reset_token.user
        user.password_hash = generate_password_hash(password)
        user.updated_at = datetime.now(timezone.utc)

        db.session.commit()

        return user
    except SQLAlchemyError:
        db.session.rollback()

        raise
