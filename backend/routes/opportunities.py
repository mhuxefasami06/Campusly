from datetime import date, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from database import db
from models import Opportunity

opportunities_bp = Blueprint("opportunities", __name__, url_prefix="/api")

CATEGORIES = [
    "Internship", "Scholarship", "Hackathon", "MUN",
    "Competition", "Event", "Workshop", "Volunteering",
]


@opportunities_bp.get("/categories")
def list_categories():
    counts = dict(
        db.session.query(Opportunity.category, db.func.count(Opportunity.id))
        .filter(Opportunity.deadline >= date.today())
        .group_by(Opportunity.category)
        .all()
    )
    return jsonify(
        categories=[{"name": c, "open": counts.get(c, 0)} for c in CATEGORIES]
    )


@opportunities_bp.get("/opportunities")
def list_opportunities():
    """Supports the same filters the frontend already offers:
    category, location, tag, type (online/in-person/hybrid), a free-text
    search (q), a deadline window in days (deadline_within), and sort
    (r=recommended, n=newest, d=deadline soon, a=recently added)."""
    q = Opportunity.query.filter(Opportunity.deadline >= date.today())

    category = request.args.get("category")
    if category:
        q = q.filter(Opportunity.category == category)

    location = request.args.get("location")
    if location:
        q = q.filter(Opportunity.location == location)

    type_ = request.args.get("type")
    if type_:
        q = q.filter(Opportunity.type == type_)

    tag = request.args.get("tag")
    if tag:
        # SQLite JSON columns are stored as text, so a LIKE match on the
        # serialized tag list works well for this dataset's size.
        q = q.filter(Opportunity.tags.like(f'%"{tag}"%'))

    deadline_within = request.args.get("deadline_within", type=int)
    if deadline_within:
        cutoff = date.today() + timedelta(days=deadline_within)
        q = q.filter(Opportunity.deadline <= cutoff)

    search = request.args.get("q", "").strip()
    if search:
        like = f"%{search}%"
        q = q.filter(
            db.or_(
                Opportunity.title.ilike(like),
                Opportunity.description.ilike(like),
                Opportunity.organization.ilike(like),
                Opportunity.location.ilike(like),
                Opportunity.category.ilike(like),
            )
        )

    sort = request.args.get("sort", "r")
    if sort == "d":
        q = q.order_by(Opportunity.deadline.asc())
    elif sort in ("n", "a"):
        q = q.order_by(Opportunity.id.desc())
    else:
        # "Recommended" needs the current user's interests, which we don't
        # have here without auth, so fall back to newest-first; the
        # dashboard route does real interest-based ranking.
        q = q.order_by(Opportunity.id.desc())

    results = q.all()
    return jsonify(
        count=len(results),
        opportunities=[o.to_dict() for o in results],
    )


@opportunities_bp.get("/opportunities/<int:opp_id>")
def get_opportunity(opp_id):
    opp = Opportunity.query.get_or_404(opp_id)

    # Log a view for streak/recommendation purposes if the caller is signed
    # in; anonymous browsing still works, it just isn't tracked.
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            from models import ViewedOpportunity

            exists = ViewedOpportunity.query.filter_by(
                user_id=int(user_id), opportunity_id=opp_id
            ).first()
            if not exists:
                db.session.add(
                    ViewedOpportunity(user_id=int(user_id), opportunity_id=opp_id)
                )
                db.session.commit()
    except Exception:
        pass

    return jsonify(opportunity=opp.to_dict())


@opportunities_bp.post("/opportunities")
@jwt_required(optional=True)
def create_opportunity():
    """Backs the 'Post Opportunity' form. Signing in is optional so the
    demo form still works for anonymous visitors, matching the frontend."""
    data = request.get_json(silent=True) or {}

    required = ["title", "organization", "category", "description", "location", "deadline"]
    missing = [f for f in required if not str(data.get(f) or "").strip()]
    if missing:
        return jsonify(error=f"Missing required field(s): {', '.join(missing)}"), 400

    if data["category"] not in CATEGORIES:
        return jsonify(error=f"category must be one of {CATEGORIES}"), 400

    try:
        deadline = date.fromisoformat(data["deadline"])
    except ValueError:
        return jsonify(error="deadline must be in YYYY-MM-DD format."), 400

    location = data["location"]
    opp = Opportunity(
        category=data["category"],
        title=data["title"],
        organization=data["organization"],
        location=location,
        type="Online" if "online" in location.lower() or "remote" in location.lower() else "In-person",
        deadline=deadline,
        description=data["description"],
        eligibility=data.get("eligibility"),
        tags=[data["category"]],
        url=data.get("url"),
        contact_email=data.get("contact_email"),
        is_demo=False,
        created_by_id=int(get_jwt_identity()) if get_jwt_identity() else None,
    )
    db.session.add(opp)
    db.session.commit()

    return jsonify(opportunity=opp.to_dict()), 201
