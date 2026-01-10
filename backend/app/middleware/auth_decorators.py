from functools import wraps
from typing import Callable, List, Optional, Union, TYPE_CHECKING
from flask import g, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User

if TYPE_CHECKING:
    from app.models import User


def get_current_user() -> Optional["User"]:
    return getattr(g, 'current_user', None)


def load_current_user() -> Optional["User"]:
    if hasattr(g, 'current_user') and g.current_user:
        return g.current_user
    
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        
        if not user_id:
            return None
        
        user = User.query.filter(
            User.id == user_id,
            User.deleted_at.is_(None)
        ).first()
        
        g.current_user = user
        return user
    except Exception:
        return None


def require_authenticated(fn: Callable) -> Callable:
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({
                "error": "authentication_required",
                "message": "Valid access token is required"
            }), 401
        
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({
                "error": "invalid_token",
                "message": "Token does not contain valid user identity"
            }), 401
        
        user = User.query.filter(
            User.id == user_id,
            User.deleted_at.is_(None)
        ).first()
        
        if not user:
            return jsonify({
                "error": "user_not_found",
                "message": "User associated with token no longer exists"
            }), 401
        
        g.current_user = user
        return fn(*args, **kwargs)
    
    return wrapper


def require_active_user(fn: Callable) -> Callable:
    @wraps(fn)
    @require_authenticated
    def wrapper(*args, **kwargs):
        user = get_current_user()
        
        if not user.is_active:
            return jsonify({
                "error": "account_inactive",
                "message": "Your account has been deactivated"
            }), 403
        
        return fn(*args, **kwargs)
    
    return wrapper


def require_verified_email(fn: Callable) -> Callable:
    @wraps(fn)
    @require_active_user
    def wrapper(*args, **kwargs):
        user = get_current_user()
        
        if not user.is_email_verified:
            return jsonify({
                "error": "email_not_verified",
                "message": "Please verify your email address to access this resource"
            }), 403
        
        return fn(*args, **kwargs)
    
    return wrapper


def require_roles(roles: Union[str, List[str]]) -> Callable:
    if isinstance(roles, str):
        roles = [roles]
    
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        @require_active_user
        def wrapper(*args, **kwargs):
            user = get_current_user()
            
            user_roles = {role.name for role in user.roles}
            
            missing_roles = set(roles) - user_roles
            if missing_roles:
                return jsonify({
                    "error": "insufficient_permissions",
                    "message": "You do not have required permissions to access this resource"
                }), 403
            
            return fn(*args, **kwargs)
        
        return wrapper
    
    return decorator


def require_any_role(roles: Union[str, List[str]]) -> Callable:
    if isinstance(roles, str):
        roles = [roles]
    
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        @require_active_user
        def wrapper(*args, **kwargs):
            user = get_current_user()
            
            user_roles = {role.name for role in user.roles}
            
            if not user_roles.intersection(set(roles)):
                return jsonify({
                    "error": "insufficient_permissions",
                    "message": "You do not have required permissions to access this resource"
                }), 403
            
            return fn(*args, **kwargs)
        
        return wrapper
    
    return decorator


def require_owner_or_role(
    resource_owner_getter: Callable,
    roles: Optional[Union[str, List[str]]] = None
) -> Callable:
    if roles is None:
        roles = ['admin']
    elif isinstance(roles, str):
        roles = [roles]
    
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        @require_active_user
        def wrapper(*args, **kwargs):
            user = get_current_user()
            
            owner_id = resource_owner_getter(*args, **kwargs)
            
            if str(user.id) == str(owner_id):
                return fn(*args, **kwargs)
            
            user_roles = {role.name for role in user.roles}
            if user_roles.intersection(set(roles)):
                return fn(*args, **kwargs)
            
            return jsonify({
                "error": "access_denied",
                "message": "You can only access your own resources"
            }), 403
        
        return wrapper
    
    return decorator
