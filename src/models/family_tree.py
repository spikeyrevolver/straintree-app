from src.models.user import db
from datetime import datetime
import uuid

class FamilyTree(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    is_public = db.Column(db.Boolean, default=False)
    share_token = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    
    # Relationships
    crosses = db.relationship('Cross', backref='family_tree', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<FamilyTree {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'owner_id': self.owner_id,
            'owner_username': self.owner.username if self.owner else f'User {self.owner_id}',
            'is_public': self.is_public,
            'share_token': self.share_token,
            'crosses_count': len(self.crosses) if self.crosses else 0
        }

class Cross(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    parent1_id = db.Column(db.Integer, db.ForeignKey('strain.id'), nullable=False)
    parent2_id = db.Column(db.Integer, db.ForeignKey('strain.id'), nullable=False)
    offspring_id = db.Column(db.Integer, db.ForeignKey('strain.id'), nullable=False)
    generation = db.Column(db.Integer, default=1)  # F1, F2, etc.
    cross_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    family_tree_id = db.Column(db.Integer, db.ForeignKey('family_tree.id'), nullable=False)
    
    # Position data for visualization
    position_x = db.Column(db.Float, default=0)
    position_y = db.Column(db.Float, default=0)
    
    # Relationships
    parent1_strain = db.relationship('Strain', foreign_keys=[parent1_id], lazy=True)
    parent2_strain = db.relationship('Strain', foreign_keys=[parent2_id], lazy=True)
    offspring_strain = db.relationship('Strain', foreign_keys=[offspring_id], lazy=True)

    def __repr__(self):
        return f'<Cross {self.parent1_strain.name} x {self.parent2_strain.name} = {self.offspring_strain.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'parent1_id': self.parent1_id,
            'parent1_name': self.parent1_strain.name if self.parent1_strain else f'Strain {self.parent1_id}',
            'parent2_id': self.parent2_id,
            'parent2_name': self.parent2_strain.name if self.parent2_strain else f'Strain {self.parent2_id}',
            'offspring_id': self.offspring_id,
            'offspring_name': self.offspring_strain.name if self.offspring_strain else f'Strain {self.offspring_id}',
            'generation': self.generation,
            'cross_date': self.cross_date.isoformat() if self.cross_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'family_tree_id': self.family_tree_id,
            'position_x': self.position_x,
            'position_y': self.position_y
        }

