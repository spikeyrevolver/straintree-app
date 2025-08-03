import os
import sys
import traceback
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, send_file
from flask_cors import CORS
from src.models.user import db
from src.models.strain import Strain
from src.models.family_tree import FamilyTree, Cross
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.strain import strain_bp
from src.routes.family_tree import family_tree_bp
# from src.routes.pdf_export import pdf_bp

try:
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

    # ADD MIME TYPE CONFIGURATION HERE
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    app.config['MIME_TYPES'] = {
        '.js': 'application/javascript',
        '.css': 'text/css'
    }

    # Disable strict slashes to handle URLs with/without trailing slashes
    app.url_map.strict_slashes = False

    # More robust session configuration for deployment
    app.config['SESSION_PERMANENT'] = False
    app.config['SESSION_COOKIE_NAME'] = 'straintree_session'
    app.config['SESSION_COOKIE_HTTPONLY'] = False
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['SESSION_COOKIE_SAMESITE'] = None  # More permissive for cross-origin
    app.config['SESSION_COOKIE_DOMAIN'] = None  # Allow any domain
    app.config['SESSION_COOKIE_PATH'] = '/'
    app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

    # Add session refresh middleware
    @app.before_request
    def refresh_session():
        from flask import session
        session.permanent = True

    # Enhanced CORS configuration for frontend-backend communication
    CORS(app, 
         supports_credentials=True, 
         origins=['https://straintree-app.onrender.com', 'http://localhost:3000', 'http://localhost:5000', '*'],
         allow_headers=['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie', 'X-Requested-With', 'Accept'],
         expose_headers=['Set-Cookie', 'Content-Type'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_credentials=True,
         max_age=3600)

    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__fi
