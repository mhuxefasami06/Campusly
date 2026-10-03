import os
from datetime import timedelta


class Config:
    """Central app configuration. Override any of these with environment
    variables in production — never hardcode real secrets."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")

    # Defaults to a local SQLite file so the project runs with zero setup.
    # Swap DATABASE_URL for a Postgres/MySQL URL when you deploy.
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///campusly.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # Comma-separated list of origins allowed to call this API, e.g.
    # "https://your-username.github.io,http://127.0.0.1:5500"
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
