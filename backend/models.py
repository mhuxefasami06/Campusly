from datetime import datetime

from database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    # Stored as a JSON array of strings, e.g. ["AI", "Design"]
    interests = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    bookmarks = db.relationship(
        "Bookmark", backref="user", cascade="all, delete-orphan"
    )
    views = db.relationship(
        "ViewedOpportunity", backref="user", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "interests": self.interests or [],
        }


class Opportunity(db.Model):
    __tablename__ = "opportunities"

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(40), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    organization = db.Column(db.String(160), nullable=False)
    location = db.Column(db.String(160), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # Online / In-person / Hybrid
    deadline = db.Column(db.Date, nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    eligibility = db.Column(db.String(300))
    requirements = db.Column(db.Text)
    duration = db.Column(db.String(120))
    tags = db.Column(db.JSON, default=list)
    url = db.Column(db.String(300))
    contact_email = db.Column(db.String(160))
    is_demo = db.Column(db.Boolean, default=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "title": self.title,
            "organization": self.organization,
            "location": self.location,
            "type": self.type,
            "deadline": self.deadline.isoformat(),
            "description": self.description,
            "eligibility": self.eligibility,
            "requirements": self.requirements,
            "duration": self.duration,
            "tags": self.tags or [],
            "url": self.url,
            "contact_email": self.contact_email,
            "demo": self.is_demo,
        }


class Bookmark(db.Model):
    __tablename__ = "bookmarks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    opportunity_id = db.Column(
        db.Integer, db.ForeignKey("opportunities.id"), nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    opportunity = db.relationship("Opportunity")

    __table_args__ = (
        db.UniqueConstraint("user_id", "opportunity_id", name="uix_user_opp"),
    )


class ViewedOpportunity(db.Model):
    """Tracks which opportunities a user has opened, so we can show the
    'X opportunities explored this week' streak and simple recommendations."""

    __tablename__ = "viewed_opportunities"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    opportunity_id = db.Column(
        db.Integer, db.ForeignKey("opportunities.id"), nullable=False
    )
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint(
            "user_id", "opportunity_id", name="uix_user_opp_view"
        ),
    )
