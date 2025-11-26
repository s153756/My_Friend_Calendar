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

### Backend quickstart (Flask + Postgres)

```
cd backend
.\.venv\Scripts\activate
pip install -r requirements.txt
$env:FLASK_APP="run.py"
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/testdb"
flask db upgrade
flask seed-demo
flask run
```

!!!!!!!!!!!!!

When schema changes, update the models in `backend/app/models/__init__.py`, then run:

```
flask db migrate -m "describe change"
flask db upgrade
```

To reset the Dockerised Postgres instance (so migrations can recreate everything from scratch), run `docker compose down -v` before `docker compose up --build`.

## to build front write:
docker build -t myfriendcalendar .

## to run front write:
docker run -d -p 3000:3000 -v $(pwd):/app myfriendcalendar 