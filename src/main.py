import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
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

# Enable CORS for all routes with credentials support
CORS(app, 
     supports_credentials=True, 
     origins=['*'],
     allow_headers=['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
     expose_headers=['Set-Cookie'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Register blueprints BEFORE any other routes
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(strain_bp, url_prefix='/api/strains')
app.register_blueprint(family_tree_bp, url_prefix='/api/family-trees')
# app.register_blueprint(pdf_bp)

# Debug: Print all registered routes
print("Registered routes:")
for rule in app.url_map.iter_rules():
    print(f"  {rule.rule} -> {rule.endpoint} [{', '.join(rule.methods)}]")

with app.app_context():
    db.create_all()

# Add a test route to verify API is working
@app.route('/api/test')
def test_api():
    return {'message': 'API is working'}, 200

# Simple backend homepage
@app.route('/')
def home():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>StrainTree API</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .status { color: green; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>�� StrainTree API</h1>
            <p class="status">✅ Backend is running successfully!</p>
            
            <h2>Available Endpoints:</h2>
            <div class="endpoint">
                <strong>Authentication:</strong> /api/auth/login, /api/auth/register, /api/auth/logout
            </div>
            <div class="endpoint">
                <strong>Users:</strong> /api/users
            </div>
            <div class="endpoint">
                <strong>Strains:</strong> /api/strains
            </div>
            <div class="endpoint">
                <strong>Family Trees:</strong> /api/family-trees
            </div>
            
            <h2>Test API:</h2>
            <p><a href="/api/test">Test API Endpoint</a></p>
            <p><a href="/api/auth/check">Check Authentication</a></p>
        </div>
    </body>
    </html>
    """

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
