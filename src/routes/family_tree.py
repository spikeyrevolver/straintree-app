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
        
        pagination = FamilyTree.query.filter_by(owner_id=user.id).order_by(
            FamilyTree.updated_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        family_trees = [ft.to_dict() for ft in pagination.items]
        
        return jsonify({
            'family_trees': family_trees,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch family trees'}), 500

@family_tree_bp.route('/', methods=['POST'])
def create_family_tree():
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        name = data.get('name', '').strip()
        if not name:
            return jsonify({'error': 'Family tree name is required'}), 400
        
        family_tree = FamilyTree(
            name=name,
            description=data.get('description', '').strip(),
            owner_id=user.id
        )
        
        db.session.add(family_tree)
        db.session.commit()
        
        return jsonify({
            'message': 'Family tree created successfully',
            'family_tree': family_tree.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create family tree'}), 500

@family_tree_bp.route('/<int:tree_id>', methods=['GET'])
def get_family_tree(tree_id):
    try:
        family_tree = FamilyTree.query.get_or_404(tree_id)
        
        user = require_auth()
        if not family_tree.is_public and (not user or family_tree.owner_id != user.id):
            return jsonify({'error': 'Access denied'}), 403
        
        crosses = Cross.query.filter_by(family_tree_id=tree_id).all()
        
        tree_data = family_tree.to_dict()
        tree_data['crosses'] = [cross.to_dict() for cross in crosses]
        
        return jsonify({'family_tree': tree_data}), 200
        
    except Exception as e:
        return jsonify({'error': 'Family tree not found'}), 404

@family_tree_bp.route('/<int:tree_id>', methods=['PUT'])
def update_family_tree(tree_id):
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        family_tree = FamilyTree.query.get_or_404(tree_id)
        
        if family_tree.owner_id != user.id:
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'Family tree name cannot be empty'}), 400
            family_tree.name = name
        
        if 'description' in data:
            family_tree.description = data['description'].strip()
        
        if 'is_public' in data:
            family_tree.is_public = bool(data['is_public'])
        
        family_tree.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Family tree updated successfully',
            'family_tree': family_tree.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update family tree'}), 500

@family_tree_bp.route('/<int:tree_id>', methods=['DELETE'])
def delete_family_tree(tree_id):
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        family_tree = FamilyTree.query.get_or_404(tree_id)
        
        if family_tree.owner_id != user.id:
            return jsonify({'error': 'Permission denied'}), 403
        
        db.session.delete(family_tree)
        db.session.commit()
        
        return jsonify({'message': 'Family tree deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete family tree'}), 500

@family_tree_bp.route('/<int:tree_id>/crosses', methods=['POST'])
def create_cross(tree_id):
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        family_tree = FamilyTree.query.get_or_404(tree_id)
        
        if family_tree.owner_id != user.id:
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        parent1_id = data.get('parent1_id')
        parent2_id = data.get('parent2_id')
        offspring_name = data.get('offspring_name', '').strip()
        
        if not all([parent1_id, parent2_id]):
            return jsonify({'error': 'Both parent strains are required'}), 400
        
        parent1 = Strain.query.get(parent1_id)
        parent2 = Strain.query.get(parent2_id)
        
        if not all([parent1, parent2]):
            return jsonify({'error': 'One or more parent strains not found'}), 404
        
        if not offspring_name:
            generation = data.get('generation', 1)
            generation_suffix = f"F{generation}" if generation > 0 else "F1"
            offspring_name = f"{parent1.name} x {parent2.name} ({generation_suffix})"
        
        existing_offspring = Strain.query.filter_by(
            name=offspring_name, 
            created_by=user.id
        ).first()
        
        if existing_offspring:
            offspring_id = existing_offspring.id
        else:
            estimated_thc = None
            estimated_cbd = None
            estimated_type = "Hybrid"
            
            if parent1.thc_content and parent2.thc_content:
                estimated_thc = round((parent1.thc_content + parent2.thc_content) / 2, 1)
            elif parent1.thc_content:
                estimated_thc = parent1.thc_content
            elif parent2.thc_content:
                estimated_thc = parent2.thc_content
                
            if parent1.cbd_content and parent2.cbd_content:
                estimated_cbd = round((parent1.cbd_content + parent2.cbd_content) / 2, 1)
            elif parent1.cbd_content:
                estimated_cbd = parent1.cbd_content
            elif parent2.cbd_content:
                estimated_cbd = parent2.cbd_content
            
            if parent1.strain_type and parent2.strain_type:
                if parent1.strain_type == parent2.strain_type:
                    estimated_type = parent1.strain_type
                else:
                    estimated_type = "Hybrid"
            elif parent1.strain_type:
                estimated_type = parent1.strain_type
            elif parent2.strain_type:
                estimated_type = parent2.strain_type
            
            offspring_strain = Strain(
                name=offspring_name,
                description=f"Cross between {parent1.name} and {parent2.name}. Automatically generated offspring strain.",
                strain_type=estimated_type,
                thc_content=estimated_thc,
                cbd_content=estimated_cbd,
                flowering_time=None,
                yield_info=None,
                created_by=user.id,
                is_verified=False
            )
            
            db.session.add(offspring_strain)
            db.session.flush()
            offspring_id = offspring_strain.id

        cross = Cross(
            parent1_id=parent1_id,
            parent2_id=parent2_id,
            offspring_id=offspring_id,
            generation=data.get('generation', 1),
            cross_date=datetime.strptime(data['cross_date'], '%Y-%m-%d').date() if data.get('cross_date') else None,
            notes=data.get('notes', '').strip(),
            family_tree_id=tree_id,
            position_x=data.get('position_x', 0),
            position_y=data.get('position_y', 0)
        )
        
        db.session.add(cross)
        family_tree.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Cross created successfully and offspring added to strain catalog',
            'cross': cross.to_dict(),
            'offspring_strain': offspring_strain.to_dict() if not existing_offspring else existing_offspring.to_dict(),
            'auto_created': not existing_offspring
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create cross: {str(e)}'}), 500

@family_tree_bp.route('/<int:tree_id>/crosses', methods=['GET'])
def get_crosses(tree_id):
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        family_tree = FamilyTree.query.get_or_404(tree_id)
        
        if not family_tree.is_public and family_tree.owner_id != user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        crosses = Cross.query.filter_by(family_tree_id=tree_id).all()
        
        crosses_data = [cross.to_dict() for cross in crosses]
        
        return jsonify({
            'crosses': crosses_data,
            'total': len(crosses_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch crosses'}), 500

@family_tree_bp.route('/<int:tree_id>/crosses/<int:cross_id>', methods=['PUT'])
def update_cross(tree_id, cross_id):
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        family_tree = FamilyTree.query.get_or_404(tree_id)
        cross = Cross.query.get_or_404(cross_id)
        
        if family_tree.owner_id != user.id or cross.family_tree_id != tree_id:
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'generation' in data:
            cross.generation = data['generation']
        if 'cross_date' in data and data['cross_date']:
            cross.cross_date = datetime.strptime(data['cross_date'], '%Y-%m-%d').date()
        if 'notes' in data:
            cross.notes = data['notes'].strip()
        if 'position_x' in data:
            cross.position_x = data['position_x']
        if 'position_y' in data:
            cross.position_y = data['position_y']
        
        family_tree.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Cross updated successfully',
            'cross': cross.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update cross'}), 500

@family_tree_bp.route('/<int:tree_id>/crosses/<int:cross_id>', methods=['DELETE'])
def delete_cross(tree_id, cross_id):
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        family_tree = FamilyTree.query.get_or_404(tree_id)
        cross = Cross.query.get_or_404(cross_id)
        
        if family_tree.owner_id != user.id or cross.family_tree_id != tree_id:
            return jsonify({'error': 'Permission denied'}), 403
        
        db.session.delete(cross)
        family_tree.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Cross deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete cross'}), 500

@family_tree_bp.route('/shared/<share_token>', methods=['GET'])
def get_shared_family_tree(share_token):
    try:
        family_tree = FamilyTree.query.filter_by(share_token=share_token).first()
        
        if not family_tree:
            return jsonify({'error': 'Shared family tree not found'}), 404
        
        crosses = Cross.query.filter_by(family_tree_id=family_tree.id).all()
        
        tree_data = family_tree.to_dict()
        tree_data['crosses'] = [cross.to_dict() for cross in crosses]
        
        return jsonify({'family_tree': tree_data}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to load shared family tree'}), 500

@family_tree_bp.route('/public', methods=['GET'])
def get_public_family_trees():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        pagination = FamilyTree.query.filter_by(is_public=True).order_by(
            FamilyTree.updated_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        family_trees = [ft.to_dict() for ft in pagination.items]
        
        return jsonify({
            'family_trees': family_trees,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch public family trees'}), 500

@family_tree_bp.route('/<int:tree_id>/parent-strains', methods=['POST'])
def add_parent_strain(tree_id):
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        family_tree = FamilyTree.query.get_or_404(tree_id)
        
        if family_tree.owner_id != user.id:
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        strain_id = data.get('strain_id')
        if not strain_id:
            return jsonify({'error': 'Strain ID is required'}), 400
        
        strain = Strain.query.get(strain_id)
        if not strain:
            return jsonify({'error': 'Strain not found'}), 404
        
        existing_cross = Cross.query.filter(
            Cross.family_tree_id == tree_id,
            (Cross.parent1_id == strain_id) | (Cross.parent2_id == strain_id)
        ).first()
        
        if existing_cross:
            return jsonify({'error': 'Strain is already a parent in this family tree'}), 400
        
        return jsonify({
            'message': 'Parent strain added successfully',
            'strain': strain.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to add parent strain'}), 500

@family_tree_bp.route('/<int:tree_id>/generate-offspring', methods=['POST'])
def generate_offspring(tree_id):
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        family_tree = FamilyTree.query.get_or_404(tree_id)
        
        if family_tree.owner_id != user.id:
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        parent1_id = data.get('parent1_id')
        parent2_id = data.get('parent2_id')
        offspring_name = data.get('offspring_name', '').strip()
        
        if not all([parent1_id, parent2_id]):
            return jsonify({'error': 'Both parent strains are required'}), 400
        
        if not offspring_name:
            return jsonify({'error': 'Offspring name is required'}), 400
        
        parent1 = Strain.query.get(parent1_id)
        parent2 = Strain.query.get(parent2_id)
        
        if not all([parent1, parent2]):
            return jsonify({'error': 'One or more parent strains not found'}), 404
        
        existing_offspring = Strain.query.filter_by(name=offspring_name).first()
        if existing_offspring:
            return jsonify({'error': 'A strain with this name already exists'}), 400
        
        avg_thc = 0
        avg_cbd = 0
        parent_count = 0
        
        if parent1.thc_content:
            try:
                avg_thc += float(parent1.thc_content)
                parent_count += 1
            except:
                pass
        
        if parent2.thc_content:
            try:
                avg_thc += float(parent2.thc_content)
                parent_count += 1
            except:
                pass
        
        if parent_count > 0:
            avg_thc = avg_thc / parent_count
        
        parent_count = 0
        if parent1.cbd_content:
            try:
                avg_cbd += float(parent1.cbd_content)
                parent_count += 1
            except:
                pass
        
        if parent2.cbd_content:
            try:
                avg_cbd += float(parent2.cbd_content)
                parent_count += 1
            except:
                pass
        
        if parent_count > 0:
            avg_cbd = avg_cbd / parent_count
        
        strain_type = "Balanced hybrid"
        if parent1.strain_type and parent2.strain_type:
            if "Sativa" in parent1.strain_type and "Sativa" in parent2.strain_type:
                strain_type = "Sativa-dominant hybrid"
            elif "Indica" in parent1.strain_type and "Indica" in parent2.strain_type:
                strain_type = "Indica-dominant hybrid"
        
        offspring = Strain(
            name=offspring_name,
            strain_type=strain_type,
            description=f"Hybrid offspring of {parent1.name} and {parent2.name}. Generated automatically based on parent characteristics.",
            thc_content=f"{avg_thc:.1f}" if avg_thc > 0 else None,
            cbd_content=f"{avg_cbd:.1f}" if avg_cbd > 0 else None,
            flowering_time=data.get('flowering_time', ''),
            yield_info=data.get('yield_info', ''),
            created_by=user.id
        )
        
        db.session.add(offspring)
        db.session.flush()
        
        cross = Cross(
            parent1_id=parent1_id,
            parent2_id=parent2_id,
            offspring_id=offspring.id,
            generation=data.get('generation', 1),
            cross_date=datetime.strptime(data['cross_date'], '%Y-%m-%d').date() if data.get('cross_date') else datetime.utcnow().date(),
            notes=data.get('notes', f'Auto-generated cross: {parent1.name} × {parent2.name}'),
            family_tree_id=tree_id,
            position_x=data.get('position_x', 0),
            position_y=data.get('position_y', 0)
        )
        
        db.session.add(cross)
        family_tree.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Offspring generated successfully',
            'offspring': offspring.to_dict(),
            'cross': cross.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to generate offspring'}), 500

@family_tree_bp.route('/<int:tree_id>/visualization', methods=['GET'])
def get_family_tree_visualization(tree_id):
    try:
        family_tree = FamilyTree.query.get_or_404(tree_id)
        
        user = require_auth()
        if not family_tree.is_public and (not user or family_tree.owner_id != user.id):
            return jsonify({'error': 'Access denied'}), 403
        
        crosses = Cross.query.filter_by(family_tree_id=tree_id).all()
        
        nodes = {}
        edges = []
        
        for cross in crosses:
            if cross.parent1_id not in nodes:
                nodes[cross.parent1_id] = {
                    'id': cross.parent1_id,
                    'name': cross.parent1_strain.name,
                    'type': 'parent',
                    'strain_type': cross.parent1_strain.strain_type,
                    'thc_content': cross.parent1_strain.thc_content,
                    'cbd_content': cross.parent1_strain.cbd_content,
                    'description': cross.parent1_strain.description,
                    'flowering_time': cross.parent1_strain.flowering_time,
                    'yield_info': cross.parent1_strain.yield_info
                }
            
            if cross.parent2_id not in nodes:
                nodes[cross.parent2_id] = {
                    'id': cross.parent2_id,
                    'name': cross.parent2_strain.name,
                    'type': 'parent',
                    'strain_type': cross.parent2_strain.strain_type,
                    'thc_content': cross.parent2_strain.thc_content,
                    'cbd_content': cross.parent2_strain.cbd_content,
                    'description': cross.parent2_strain.description,
                    'flowering_time': cross.parent2_strain.flowering_time,
                    'yield_info': cross.parent2_strain.yield_info
                }
            
            if cross.offspring_id not in nodes:
                nodes[cross.offspring_id] = {
                    'id': cross.offspring_id,
                    'name': cross.offspring_strain.name,
                    'type': 'offspring',
                    'strain_type': cross.offspring_strain.strain_type,
                    'thc_content': cross.offspring_strain.thc_content,
                    'cbd_content': cross.offspring_strain.cbd_content,
                    'description': cross.offspring_strain.description,
                    'flowering_time': cross.offspring_strain.flowering_time,
                    'yield_info': cross.offspring_strain.yield_info,
                    'generation': cross.generation
                }
            
            edges.append({
                'id': cross.id,
                'parent1_id': cross.parent1_id,
                'parent2_id': cross.parent2_id,
                'offspring_id': cross.offspring_id,
                'generation': cross.generation,
                'cross_date': cross.cross_date.isoformat() if cross.cross_date else None,
                'notes': cross.notes,
                'position_x': cross.position_x,
                'position_y': cross.position_y
            })
        
        visualization_data = {
            'family_tree': family_tree.to_dict(),
            'nodes': list(nodes.values()),
            'edges': edges
        }
        
        return jsonify(visualization_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to load visualization data'}), 500

@family_tree_bp.route('/<int:tree_id>/available-strains', methods=['GET'])
def get_available_strains(tree_id):
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        family_tree = FamilyTree.query.get_or_404(tree_id)
        
        if not family_tree.is_public and family_tree.owner_id != user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        strains = Strain.query.filter_by(created_by=user.id).order_by(Strain.name).all()
        
        strain_options = []
        for strain in strains:
            is_offspring = (
                ' x ' in strain.name and 
                ('(F' in strain.name or 'F1' in strain.name or 'F2' in strain.name or 'F3' in strain.name or 'F4' in strain.name or 'F5' in strain.name)
            ) or (
                'Cross between' in (strain.description or '') and 'offspring' in (strain.description or '')
            )
            
            strain_options.append({
                'id': strain.id,
                'name': strain.name,
                'type': strain.strain_type,
                'thc_content': strain.thc_content,
                'cbd_content': strain.cbd_content,
                'flowering_time': strain.flowering_time,
                'yield_info': strain.yield_info,
                'description': strain.description,
                'is_offspring': is_offspring,
                'is_verified': strain.is_verified
            })
        
        return jsonify({'strains': strain_options}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch available strains'}), 500

@family_tree_bp.route('/<int:tree_id>/next-generation', methods=['GET'])
def get_next_generation(tree_id):
    try:
        user = require_auth()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        family_tree = FamilyTree.query.get_or_404(tree_id)
        
        if not family_tree.is_public and family_tree.owner_id != user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        crosses = Cross.query.filter_by(family_tree_id=tree_id).all()
        
        max_generation = 0
        for cross in crosses:
            if cross.generation:
                try:
                    if isinstance(cross.generation, int):
                        gen_num = cross.generation
                    else:
                        gen_str = str(cross.generation).replace('F', '')
                        gen_num = int(gen_str)
                    max_generation = max(max_generation, gen_num)
                except (ValueError, TypeError):
                    continue
        
        next_generation = f"F{max_generation + 1}"
        
        return jsonify({'next_generation': next_generation}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to determine next generation'}), 500
