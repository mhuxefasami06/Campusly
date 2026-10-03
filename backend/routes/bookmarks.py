from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db
from models import Bookmark, Opportunity

bookmarks_bp = Blueprint("bookmarks", __name__, url_prefix="/api/bookmarks")


@bookmarks_bp.get("")
@jwt_required()
def list_bookmarks():
    user_id = int(get_jwt_identity())
    marks = Bookmark.query.filter_by(user_id=user_id).all()
    return jsonify(
        bookmarks=[m.opportunity.to_dict() for m in marks if m.opportunity]
    )


@bookmarks_bp.post("/<int:opp_id>")
@jwt_required()
def add_bookmark(opp_id):
    user_id = int(get_jwt_identity())
    Opportunity.query.get_or_404(opp_id)  # 404s if the opportunity doesn't exist

    existing = Bookmark.query.filter_by(user_id=user_id, opportunity_id=opp_id).first()
    if not existing:
        db.session.add(Bookmark(user_id=user_id, opportunity_id=opp_id))
        db.session.commit()

    return jsonify(saved=True), 201


@bookmarks_bp.delete("/<int:opp_id>")
@jwt_required()
def remove_bookmark(opp_id):
    user_id = int(get_jwt_identity())
    Bookmark.query.filter_by(user_id=user_id, opportunity_id=opp_id).delete()
    db.session.commit()
    return jsonify(saved=False)
