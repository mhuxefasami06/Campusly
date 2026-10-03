from datetime import date, timedelta

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db
from models import User, Bookmark, Opportunity, ViewedOpportunity

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


def _match_score(opp, interests):
    """Simple, explainable scoring: base score plus a bonus per matching
    interest tag. Mirrors the frontend's demo match% logic."""
    overlap = len(set(opp.tags or []) & set(interests))
    return min(99, 52 + overlap * 20 + (opp.id % 9))


@dashboard_bp.get("")
@jwt_required()
def get_dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    interests = user.interests or []

    saved_opps = [
        b.opportunity for b in Bookmark.query.filter_by(user_id=user_id).all()
        if b.opportunity
    ]

    upcoming = (
        Opportunity.query.filter(Opportunity.deadline >= date.today())
        .order_by(Opportunity.deadline.asc())
        .limit(3)
        .all()
    )

    candidates = Opportunity.query.filter(Opportunity.deadline >= date.today()).all()
    recommended = sorted(
        candidates, key=lambda o: _match_score(o, interests), reverse=True
    )[:3]

    week_ago = date.today() - timedelta(days=7)
    streak_count = ViewedOpportunity.query.filter(
        ViewedOpportunity.user_id == user_id,
        ViewedOpportunity.viewed_at >= week_ago,
    ).count()

    profile_progress = min(
        100,
        20
        + len(interests) * 15
        + (20 if user.name and user.email else 0)
        + (15 if saved_opps else 0),
    )

    return jsonify(
        saved=[o.to_dict() for o in saved_opps],
        upcoming_deadlines=[o.to_dict() for o in upcoming],
        recommended=[
            {**o.to_dict(), "match": _match_score(o, interests)} for o in recommended
        ],
        streak={"opportunities_this_week": streak_count},
        profile_progress=profile_progress,
        interests=interests,
    )
