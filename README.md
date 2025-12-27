# MyFriendCalendar.io
## Project Overview
This repository contains two main parts:
```
backend/ – Python-based backend, 
frontend/ – web frontend application. Both are stored in separate folders to keep the project modular and maintainable.
```
## Branch Naming Convention
Branches must follow this pattern: 

` <task-number>-<very-short-description> `

Example: 
`123-add-user-auth`

## Coding Standards
The backend must follow standard Python coding conventions, including PEP 8 styling, clear and maintainable code structure, use of type hints where appropriate, and meaningful commit messages.

## Code Review Process
The current Product Manager must be assigned as the reviewer.
When the merge request is ready, add the label: `ready_to_review`

## Running the Project
Instructions for running the backend and frontend are located in their respective folders.

## Adding endpoints

- Blueprint per feature in `backend/app/routes/<feature>_routes.py`; business logic in `backend/app/services/<feature>_service.py`.
- Register blueprints in `create_app()` (see `run.py`): `app.register_blueprint(...)`. API prefix: `/api/<feature>`.

Example:
- Service: `authenticate_user(email, password)` in `app/services/auth_service.py`.
- Route: `auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')`; `@auth_bp.route('/login', methods=['POST'])`.
- Register: `from app.routes.auth_routes import auth_bp`; `app.register_blueprint(auth_bp)`.

## Building project

to build project use:
docker compose up --build -d

to remove created containers run

docker-compose down -v


## Api documentation
`http://localhost:5000/apidocs/`