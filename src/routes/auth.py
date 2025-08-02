from flask import Blueprint, request, jsonify, session
from src.models.user import db, User
import re
import traceback

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    # At least 8 characters, one uppercase, one lowercase, one digit
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    return True, "Valid password"

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        print(f"Registration attempt: username={username}, email={email}")
        
        # Validation
        if not username or len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters long'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        is_valid, password_message = validate_password(password)
        if not is_valid:
            return jsonify({'error': password_message}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f"Username {username} already exists")
            return jsonify({'error': 'Username already exists'}), 400
        
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            print(f"Email {email} already registered")
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        print(f"Creating new user: {username}")
        user = User(username=username, email=email)
        user.set_password(password)
        
        print(f"Adding user to database")
        db.session.add(user)
        db.session.commit()
        print(f"User created successfully with ID: {user.id}")
        
        # Log in the user with more robust session management
        session.clear()  # Clear any existing session data
        session.permanent = True
        session['user_id'] = user.id
        session['username'] = user.username
        session['authenticated'] = True
        
        # Force session save
        session.modified = True
        
        print(f"User logged in with session: user_id={user.id}")
        print(f"Session contents: {dict(session)}")
        print(f"Session permanent: {session.permanent}")
        
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict(),
            'session_id': session.get('user_id')
        }), 201
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username_or_email = data.get('username', '').strip()
        password = data.get('password', '')
        
        print(f"Login attempt: {username_or_email}")
        
        if not username_or_email or not password:
            return jsonify({'error': 'Username/email and password are required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username_or_email) | 
            (User.email == username_or_email.lower())
        ).first()
        
        if not user:
            print(f"User not found: {username_or_email}")
            return jsonify({'error': 'Invalid credentials'}), 401
            
        if not user.check_password(password):
            print(f"Invalid password for user: {username_or_email}")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Log in the user with more robust session management
        session.clear()  # Clear any existing session data
        session.permanent = True
        session['user_id'] = user.id
        session['username'] = user.username
        session['authenticated'] = True
        
        # Force session save
        session.modified = True
        
        print(f"User logged in successfully: {user.username}")
        print(f"Session contents: {dict(session)}")
        print(f"Session permanent: {session.permanent}")
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'session_id': session.get('user_id')
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user:
        session.clear()
        return jsonify({'error': 'User not found'}), 401
    
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/check', methods=['GET'])
def check_auth():
    print(f"Auth check - Session contents: {dict(session)}")
    user_id = session.get('user_id')
    print(f"Auth check - User ID from session: {user_id}")
    if user_id:
        user = User.query.get(user_id)
        if user:
            print(f"Auth check - User found: {user.username}")
            return jsonify({'authenticated': True, 'user': user.to_dict()}), 200
        else:
            print(f"Auth check - User not found in database")
    else:
        print(f"Auth check - No user_id in session")
    
    return jsonify({'authenticated': False}), 200

