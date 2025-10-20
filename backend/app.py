import os

from dotenv import load_dotenv

from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from models.database import db

import blueprints

def create_app():
    """Application factory. Initializes Flask, registers blueprints and returns the app."""
    load_dotenv()

    app = Flask(__name__)

    # General configuration
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "dev")   # Load from .env, fallback to "dev"
    app.config['TEMPLATES_AUTO_RELOAD'] = os.getenv("RELOAD_TEMPLATES", False)  # Load from .env, fallback to False

    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///dms.db')  # Load from .env, fallback to SQLite
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable track modifications

    # Initialize extensions
    db.init_app(app)
    Migrate(app, db)  # Initialize Flask-Migrate

    # Initialize CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    for module in blueprints.submodules:
        app.register_blueprint(module.bp)

    return app

if __name__ == "__main__":
    app = create_app()
    dbg_mode = os.getenv("FLASK_DEBUG", "0")
    app.run(debug=dbg_mode)

