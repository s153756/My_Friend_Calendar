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

    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)

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

        users_seed = [
            {"email": "kacper@example.com", "display_name": "Kacper", "full_name": "Kacper"},
            {"email": "filip@example.com", "display_name": "Filip", "full_name": "Filip"},
            {"email": "kuba@example.com", "display_name": "Kuba", "full_name": "Kuba"},
            {"email": "krystian@example.com", "display_name": "Krystian", "full_name": "Krystian"},
            {"email": "wiktor@example.com", "display_name": "Wiktor", "full_name": "Wiktor"},
        ]

        for u in users_seed:
            existing = User.query.filter_by(email=u["email"]).first()
            if existing:
                continue

            new_user = User()
            new_user.email = u["email"]
            new_user.password_hash = generate_password_hash("demo123")
            new_user.password_algorithm = "pbkdf2:sha256"
            new_user.is_email_verified = True
            new_user.is_active = True
            db.session.add(new_user)
            db.session.flush()

            profile = UserProfile()
            profile.user_id = new_user.id
            profile.display_name = u["display_name"]
            profile.full_name = u["full_name"]
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

            # wszyscy mają najwyższą rolę admin
            admin_role.users.append(new_user)

        db.session.commit()


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
