from flask_sqlalchemy import SQLAlchemy

# A single shared SQLAlchemy instance. Kept in its own module (instead of
# app.py) so models.py and routes/*.py can import it without circular imports.
db = SQLAlchemy()
