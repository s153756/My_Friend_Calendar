import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# 1. Configure Database
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Simple hello world to test connection
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)


with app.app_context():
    try:
        db.create_all()
        print("✅ Database connected and tables created!")
    except OperationalError as e:
        print("❌ ERROR: Database connection: ", e)


@app.route('/api/test-db')
def test_db():
    try:
        # CREATE: Insert a new dummy user
        new_user = User(name="Hello World")
        db.session.add(new_user)
        db.session.commit()

        # READ: Count how many users are in the DB
        user_count = User.query.count()

        return jsonify({
            "message": "Database write successful!",
            "total_users": user_count
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
