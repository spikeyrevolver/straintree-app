import os
import sys
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
app.config['SESSION_COO
