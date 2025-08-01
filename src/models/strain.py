from src.models.user import db
from datetime import datetime

class Strain(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    strain_type = db.Column(db.String(20))  # indica, sativa, hybrid
    thc_content = db.Column(db.Float)
    cbd_content = db.Column(db.Float)
    flowering_time = db.Column(db.String(50))
    yield_info = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Verification fields
    is_verified = db.Column(db.Boolean, default=False)  # For community verification
    is_lab_tested = db.Column(db.Boolean, default=False)  # Lab-tested verification
    lab_name = db.Column(db.String(200))  # Name of the testing laboratory
    lab_test_date = db.Column(db.Date)  # Date of lab testing
    lab_report_url = db.Column(db.String(500))  # URL to lab report document
    lab_certificate_number = db.Column(db.String(100))  # Lab certificate/batch number
    verified_thc = db.Column(db.Float)  # Lab-verified THC content
    verified_cbd = db.Column(db.Float)  # Lab-verified CBD content
    verified_terpenes = db.Column(db.Text)  # JSON string of terpene profile
    verification_notes = db.Column(db.Text)  # Additional verification notes
    verified_at = db.Column(db.DateTime)  # When verification was approved
    verified_by = db.Column(db.Integer, db.ForeignKey('user.id'))  # Admin who verified
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by])
    verifier = db.relationship('User', foreign_keys=[verified_by])
    
    # Cross relationships
    parent_crosses = db.relationship('Cross', foreign_keys='Cross.parent1_id', lazy=True)
    parent2_crosses = db.relationship('Cross', foreign_keys='Cross.parent2_id', lazy=True)
    offspring_crosses = db.relationship('Cross', foreign_keys='Cross.offspring_id', lazy=True)

    def __repr__(self):
        return f'<Strain {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'strain_type': self.strain_type,
            'thc_content': self.thc_content,
            'cbd_content': self.cbd_content,
            'flowering_time': self.flowering_time,
            'yield_info': self.yield_info,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.created_by,
            'is_verified': self.is_verified,
            'is_lab_tested': self.is_lab_tested,
            'lab_name': self.lab_name,
            'lab_test_date': self.lab_test_date.isoformat() if self.lab_test_date else None,
            'lab_report_url': self.lab_report_url,
            'lab_certificate_number': self.lab_certificate_number,
            'verified_thc': self.verified_thc,
            'verified_cbd': self.verified_cbd,
            'verified_terpenes': self.verified_terpenes,
            'verification_notes': self.verification_notes,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'verified_by': self.verified_by,
            'creator_username': self.creator.username if self.creator else None,
            'verifier_username': self.verifier.username if self.verifier else None
        }

