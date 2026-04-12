import os
import sys

from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Add parent directory to path to import config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DevelopmentConfig

db = SQLAlchemy()


def create_app() -> Flask:
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(DevelopmentConfig)

    # Initialize database
    db.init_app(app)

    # Register blueprints
    from .routes import api
    app.register_blueprint(api)

    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully")
        except Exception as e:
            print(f"Warning: Could not create database tables: {e}")

    return app

