from flask import Blueprint, request, jsonify, session
from src.models.user import db, User
from src.models.strain import Strain
from src.models.family_tree import FamilyTree, Cross
from datetime import datetime

family_tree_bp = Blueprint('family_tree', __name__)

def require_auth():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

@family_tree_bp.route('/', methods=['GET'])
def get_family_trees():
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Get user's family trees
        pagination = FamilyTree.query.filter_by(owner_id=user.id).order_by(
            FamilyTree.updated_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        f
