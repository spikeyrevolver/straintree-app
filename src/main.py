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

    # Debug route to check what files exist
    @app.route('/debug/files')
    def debug_files():
        import os
        files = []
        for root, dirs, filenames in os.walk('src/static'):
            for filename in filenames:
                files.append(os.path.join(root, filename))
        return {'files': files}

    # Debug route to check file structure
    @app.route('/debug/structure')
    def debug_structure():
        import os
        structure = {}
        for root, dirs, files in os.walk('.'):
            structure[root] = {
                'dirs': dirs,
                'files': files
            }
        return structure

    # Debug route to check paths
    @app.route('/debug/paths')
    def debug_paths():
        import os
        return {
            'current_dir': os.getcwd(),
            'static_exists': os.path.exists('src/static'),
            'index_exists': os.path.exists('src/static/index.html'),
            'files_in_static': os.listdir('src/static') if os.path.exists('src/static') else 'No static dir'
        }

    # Serve JavaScript files with correct MIME type
    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        file_path = os.path.join('src/static/assets', filename)
        if os.path.exists(file_path):
            if filename.endswith('.js'):
                return send_file(file_path, mimetype='application/javascript')
            elif filename.endswith('.css'):
                return send_file(file_path, mimetype='text/css')
            else:
                return send_from_directory('src/static/assets', filename)
        else:
            return f"Asset not found: {filename}", 404

    # Serve React app
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        # Don't interfere with API routes
        if path.startswith('api/'):
            return "Not found", 404
        
        # Serve static files if they exist
        static_path = os.path.join('src/static', path)
        if path != "" and os.path.exists(static_path):
            return send_from_directory('src/static', path)
        else:
            # For SPA routing, serve index.html for non-API routes
            index_path = os.path.join('src/static', 'index.html')
            if os.path.exists(index_path):
                return send_from_directory('src/static', 'index.html')
            else:
                return f"File not found: {path}. Available files: {os.listdir('src/static') if os.path.exists('src/static') else 'src/static directory not found'}", 404

    if __name__ == '__main__':
        port = int(os.environ.get('PORT', 5000))
        print(f"Starting Flask app on port {port}")
        app.run(host='0.0.0.0', port=port, debug=False)

except Exception as e:
    print(f"Error starting Flask app: {e}")
    print(traceback.format_exc())
    raise
