import os
from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import text
from app.extensions import db, migrate
from app import models  
from app.models import User  


def create_app():
    app = Flask(__name__)

    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    migrate.init_app(app, db)

    @app.route("/api/test-db")
    def health():
        try:
            db.session.execute(text("SELECT 1"))
            return jsonify({"status": "ok"})
        except Exception:
            return jsonify({"status": "error"}), 500

    @app.route("/api/users/first")
    def first_user():
        user = User.query.order_by(User.created_at.asc()).first()
        if not user:
            return jsonify({"message": "No users found"}), 404
        return jsonify(
            {"id": str(user.id), "email": user.email, "verified": user.is_email_verified}
        )

    register_cli_commands(app)

    return app


def register_cli_commands(app):
    from flask.cli import with_appcontext
    from app.models import User, Role, UserProfile, UserSettings
    from werkzeug.security import generate_password_hash

    @app.cli.command("seed-demo")
    @with_appcontext
    def seed_demo():
        admin_role = Role.query.filter_by(name="admin").first()
        if not admin_role:
            admin_role = Role(name="admin")
            db.session.add(admin_role)

        user_role = Role.query.filter_by(name="user").first()
        if not user_role:
            user_role = Role(name="user")
            db.session.add(user_role)

        demo_user = User.query.filter_by(email="demo@example.com").first()
        if not demo_user:
            demo_user = User(
                email="demo@example.com",
                password_hash=generate_password_hash("demo123"),
                password_algorithm="pbkdf2:sha256",
                is_email_verified=True,
                is_active=True,
            )
            db.session.add(demo_user)
            db.session.flush()

            profile = UserProfile(
                user_id=demo_user.id,
                display_name="Demo",
                full_name="Demo User",
                timezone="Europe/Warsaw",
                locale="pl_PL",
            )
            settings = UserSettings(
                user_id=demo_user.id,
                week_starts_on=1,
                default_view="month",
                time_format="24h",
                notifications_email=True,
                notifications_push=True,
            )
            db.session.add(profile)
            db.session.add(settings)

            admin_role.users.append(demo_user)

        db.session.commit()


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
