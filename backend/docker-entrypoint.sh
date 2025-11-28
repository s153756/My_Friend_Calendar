#!/bin/bash
set -e

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}

until nc -z $DB_HOST $DB_PORT; do
  echo "Database is not avaiable yet."
  sleep 1
done

echo "PostgreSQL is ready."

export FLASK_APP="run.py"

flask db upgrade
flask seed-demo

exec "$@"
