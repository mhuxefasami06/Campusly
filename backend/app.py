from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from database import db


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    JWTManager(app)
    origins = app.config["CORS_ORIGINS"]
    CORS(app, resources={r"/api/*": {"origins": origins.split(",") if origins != "*" else "*"}})

    # Import models before create_all so SQLAlchemy knows about every table.
    from models import User, Opportunity, Bookmark, ViewedOpportunity  # noqa: F401

    from routes.auth import auth_bp
    from routes.opportunities import opportunities_bp
    from routes.bookmarks import bookmarks_bp
    from routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(opportunities_bp)
    app.register_blueprint(bookmarks_bp)
    app.register_blueprint(dashboard_bp)

    @app.get("/api/health")
    def health():
        return jsonify(status="ok")

    @app.errorhandler(404)
    def not_found(e):
        return jsonify(error="Not found."), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify(error="Something went wrong on our end."), 500

    with app.app_context():
        db.create_all()
        from seed_data import seed_opportunities
        seed_opportunities(db, Opportunity)

    return app


app = create_app()

if __name__ == "__main__":
    # debug=True is fine for local hackathon development; turn it off
    # (or use a proper WSGI server like gunicorn) before deploying.
    app.run(debug=True, port=5000)
