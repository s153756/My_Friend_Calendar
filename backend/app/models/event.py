from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone

class Event(db.Model):
    __tablename__ = 'events'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_time = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(255), nullable=True)
    end_time = db.Column(db.DateTime(timezone=True), nullable=False)
    owner_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)

    owner = db.relationship('User', back_populates='owned_events')
    participant_links = db.relationship("EventParticipant", back_populates="event",
                                        cascade="all, delete-orphan", lazy="dynamic")


    def user_has_access(self, user):
        if self.owner_id == user.id:
            return True

        return (
            self.participant_links.
            filter(EventParticipant.user_id == user.id).
            first() is not None)


    def to_dict(self):
        links = self.participant_links.all()

        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'location': self.location,
            'owner': {
                'id': self.owner.id,
                'email': self.owner.email
            } if self.owner else None,
            'participants': [{
                'id': link.user.id,
                'email': link.user.email
            } for link in links],
        }


class EventParticipant(db.Model):
    __tablename__ = 'event_participants'

    event_id = db.Column('event_id', db.Integer, db.ForeignKey('events.id', ondelete='CASCADE'), primary_key=True)
    user_id = db.Column('user_id', UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    status = db.Column('status', db.String(50), default='confirmed')
    joined_at = db.Column('joined_at', db.DateTime, default=datetime.now(timezone.utc))

    event = db.relationship("Event", back_populates="participant_links")
    user = db.relationship("User", back_populates="event_participations")
