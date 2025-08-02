from flask import Blueprint, request, jsonify, session
from src.models.user import db, User
from src.models.strain import Strain
from src.models.family_tree import Cross
from sqlalchemy import or_, func
from datetime import datetime

strain_bp = Blueprint('strain', __name__)

def require_auth():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

def safe_float(value):
    """Safely convert value to float, returning None for empty/invalid values"""
    if value == '' or value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

@strain_bp.route('/', methods=['GET'])
def get_strains():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        strain_type = request.args.get('type', '').strip()
        verified_only = request.args.get('verified_only', '').lower() == 'true'
        lab_tested_only = request.args.get('lab_tested_only', '').lower() == 'true'
        
        query = Strain.query
        
        # Apply search filter
        if search:
            query = query.filter(
                or_(
                    Strain.name.ilike(f'%{search}%'),
                    Strain.description.ilike(f'%{search}%')
                )
            )
        
        # Apply type filter
        if strain_type:
            query = query.filter(Strain.strain_type == strain_type)
        
        # Apply verification filters
        if verified_only:
            query = query.filter(Strain.is_verified == True)
        
        if lab_tested_only:
            query = query.filter(Strain.is_lab_tested == True)
        
        # Order by lab tested, verified status, and name
        query = query.order_by(
            Strain.is_lab_tested.desc(),
            Strain.is_verified.desc(), 
            Strain.name
        )
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        strains = [strain.to_dict() for strain in pagination.items]
        
        return jsonify({
            'strains': strains,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch strains'}), 500

@strain_bp.route('/', methods=['POST'])
def create_strain():
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        name = data.get('name', '').strip()
        if not name:
            return jsonify({'error': 'Strain name is required'}), 400
        
        # Check if strain already exists
        existing = Strain.query.filter_by(name=name).first()
        if existing:
            return jsonify({'error': 'Strain with this name already exists'}), 400
        
        # Safely convert numeric fields
        thc_content = safe_float(data.get('thc_content'))
        cbd_content = safe_float(data.get('cbd_content'))
        
        strain = Strain(
            name=name,
            description=data.get('description', '').strip(),
            strain_type=data.get('strain_type', '').strip(),
            thc_content=thc_content,
            cbd_content=cbd_content,
            flowering_time=data.get('flowering_time', '').strip(),
            yield_info=data.get('yield_info', '').strip(),
            created_by=user.id
        )
        
        db.session.add(strain)
        db.session.commit()
        
        # Simple response without calling to_dict to avoid relationship issues
        return jsonify({
            'message': 'Strain created successfully',
            'strain': {
                'id': strain.id,
                'name': strain.name,
                'description': strain.description,
                'strain_type': strain.strain_type,
                'thc_content': strain.thc_content,
                'cbd_content': strain.cbd_content,
                'flowering_time': strain.flowering_time,
                'yield_info': strain.yield_info,
                'created_by': strain.created_by
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Strain creation error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to create strain: {str(e)}'}), 500

@strain_bp.route('/<int:strain_id>', methods=['GET'])
def get_strain(strain_id):
    try:
        strain = Strain.query.get_or_404(strain_id)
        
        # Get family trees where this strain appears
        crosses_as_parent1 = Cross.query.filter_by(parent1_id=strain_id).all()
        crosses_as_parent2 = Cross.query.filter_by(parent2_id=strain_id).all()
        crosses_as_offspring = Cross.query.filter_by(offspring_id=strain_id).all()
        
        family_tree_ids = set()
        for cross in crosses_as_parent1 + crosses_as_parent2 + crosses_as_offspring:
            family_tree_ids.add(cross.family_tree_id)
        
        from src.models.family_tree import FamilyTree
        family_trees = FamilyTree.query.filter(
            FamilyTree.id.in_(family_tree_ids),
            FamilyTree.is_public == True
        ).all()
        
        strain_data = strain.to_dict()
        strain_data['family_trees'] = [ft.to_dict() for ft in family_trees]
        strain_data['usage_count'] = len(crosses_as_parent1) + len(crosses_as_parent2) + len(crosses_as_offspring)
        
        return jsonify({'strain': strain_data}), 200
        
    except Exception as e:
        return jsonify({'error': 'Strain not found'}), 404

@strain_bp.route('/<int:strain_id>', methods=['PUT'])
def update_strain(strain_id):
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        strain = Strain.query.get_or_404(strain_id)
        
        # Only creator can edit (or admin in future)
        if strain.created_by != user.id:
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'Strain name cannot be empty'}), 400
            
            # Check if new name conflicts with existing strain
            existing = Strain.query.filter(
                Strain.name == name,
                Strain.id != strain_id
            ).first()
            if existing:
                return jsonify({'error': 'Strain with this name already exists'}), 400
            
            strain.name = name
        
        if 'description' in data:
            strain.description = data['description'].strip()
        if 'strain_type' in data:
            strain.strain_type = data['strain_type'].strip()
        if 'thc_content' in data:
            strain.thc_content = safe_float(data['thc_content'])
        if 'cbd_content' in data:
            strain.cbd_content = safe_float(data['cbd_content'])
        if 'flowering_time' in data:
            strain.flowering_time = data['flowering_time'].strip()
        if 'yield_info' in data:
            strain.yield_info = data['yield_info'].strip()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Strain updated successfully',
            'strain': strain.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update strain'}), 500

@strain_bp.route('/<int:strain_id>/submit-verification', methods=['POST'])
def submit_lab_verification(strain_id):
    """Submit lab test results for strain verification"""
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        strain = Strain.query.get_or_404(strain_id)
        
        # Only creator can submit verification (or allow others in future)
        if strain.created_by != user.id:
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Required fields for lab verification
        lab_name = data.get('lab_name', '').strip()
        if not lab_name:
            return jsonify({'error': 'Lab name is required'}), 400
        
        # Update strain with lab test information
        strain.lab_name = lab_name
        strain.lab_test_date = datetime.strptime(data['lab_test_date'], '%Y-%m-%d').date() if data.get('lab_test_date') else None
        strain.lab_report_url = data.get('lab_report_url', '').strip()
        strain.lab_certificate_number = data.get('lab_certificate_number', '').strip()
        strain.verified_thc = safe_float(data.get('verified_thc'))
        strain.verified_cbd = safe_float(data.get('verified_cbd'))
        strain.verified_terpenes = data.get('verified_terpenes', '').strip()
        strain.verification_notes = data.get('verification_notes', '').strip()
        
        # Mark as pending verification (admin will approve)
        # For now, auto-approve lab tested status
        strain.is_lab_tested = True
        strain.verified_at = datetime.utcnow()
        strain.verified_by = user.id  # In future, this should be admin
        
        db.session.commit()
        
        return jsonify({
            'message': 'Lab verification submitted successfully',
            'strain': strain.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit verification'}), 500

@strain_bp.route('/<int:strain_id>/verify', methods=['POST'])
def verify_strain(strain_id):
    """Admin endpoint to verify a strain"""
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # For now, allow any user to verify. In future, restrict to admins
        # if not user.is_admin:
        #     return jsonify({'error': 'Admin access required'}), 403
        
        strain = Strain.query.get_or_404(strain_id)
        
        data = request.get_json()
        verification_type = data.get('type', 'community')  # 'community' or 'lab'
        
        if verification_type == 'community':
            strain.is_verified = True
        elif verification_type == 'lab':
            strain.is_lab_tested = True
        
        strain.verified_at = datetime.utcnow()
        strain.verified_by = user.id
        
        if data.get('notes'):
            strain.verification_notes = data['notes'].strip()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Strain {verification_type} verification approved',
            'strain': strain.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to verify strain'}), 500

@strain_bp.route('/search', methods=['GET'])
def search_strains():
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({'strains': []}), 200
        
        strains = Strain.query.filter(
            Strain.name.ilike(f'%{query}%')
        ).order_by(
            Strain.is_lab_tested.desc(),
            Strain.is_verified.desc(), 
            Strain.name
        ).limit(10).all()
        
        return jsonify({
            'strains': [strain.to_dict() for strain in strains]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Search failed'}), 500

@strain_bp.route('/verified', methods=['GET'])
def get_verified_strains():
    """Get all verified strains"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = Strain.query.filter(
            or_(Strain.is_verified == True, Strain.is_lab_tested == True)
        ).order_by(
            Strain.is_lab_tested.desc(),
            Strain.is_verified.desc(),
            Strain.name
        )
        
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        strains = [strain.to_dict() for strain in pagination.items]
        
        return jsonify({
            'strains': strains,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch verified strains'}), 500
