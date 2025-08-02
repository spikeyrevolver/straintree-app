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

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
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

@app.route('/')
def serve_index():
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404
    
    index_path = os.path.join(static_folder_path, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(static_folder_path, 'index.html')
    else:
        return "index.html not found", 404

@app.route('/<path:path>')
def serve_spa(path):
    # Serve static files if they exist
    static_folder_path = app.static_folder
    if static_folder_path and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    
    # For SPA routing, serve index.html for non-API routes
    if not path.startswith('api/'):
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
    
    return "Not found", 404


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

