from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID, CITEXT
from .associations import event_participants
import uuid

class Event(db.Model):
    __tablename__ = 'events'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_time = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(255))
    end_time = db.Column(db.DateTime, nullable=False)
    owner_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)

    owner = db.relationship('User', back_populates='owned_events')
    participants = db.relationship('User', secondary=event_participants,
                                  back_populates='participated_events', lazy='dynamic')


    def user_has_access(self, user):
        if self.owner_id == user.id:
            return True

        if self.participants.filter(User.id == user.id).first() is not None:
            return True

        return False