from datetime import datetime
from app.extensions import db

event_participants = db.Table('event_participants',
    db.Column('event_id', db.Integer, db.ForeignKey('events.id', ondelete='CASCADE'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    db.Column('status', db.String(50), default='confirmed'),
    db.Column('joined_at', db.DateTime, default=datetime.utcnow)
)