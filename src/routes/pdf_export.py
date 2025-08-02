from flask import Blueprint, request, jsonify, send_file, current_app
from flask_cors import cross_origin
import os
import io
import json
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Circle, Line, String
from reportlab.graphics import renderPDF
from src.models.user import User, db
from src.models.family_tree import FamilyTree, Cross
import uuid

pdf_bp = Blueprint('pdf', __name__)

# Simulated payment processing (in production, integrate with Stripe, PayPal, etc.)
PAYMENT_PLANS = {
    'basic': {
        'name': 'Basic PDF Export',
        'price': 2.99,
        'description': 'High-quality PDF export of your family tree',
        'features': ['PDF export', 'Basic formatting', 'Strain details']
    },
    'premium': {
        'name': 'Premium PDF Export',
        'price': 9.99,
        'description': 'Professional PDF with advanced features',
        'features': ['PDF export', 'Professional formatting', 'Strain details', 'Breeder branding', 'High-res graphics', 'Custom watermark']
    }
}

@pdf_bp.route('/api/pdf/plans', methods=['GET'])
@cross_origin()
def get_payment_plans():
    """Get available PDF export payment plans"""
    return jsonify({
        'success': True,
        'plans': PAYMENT_PLANS
    })

@pdf_bp.route('/api/pdf/create-payment-intent', methods=['POST'])
@cross_origin()
def create_payment_intent():
    """Create a payment intent for PDF export"""
    try:
        data = request.get_json()
        plan_type = data.get('plan_type', 'basic')
        family_tree_id = data.get('family_tree_id')
        
        if plan_type not in PAYMENT_PLANS:
            return jsonify({'success': False, 'error': 'Invalid plan type'}), 400
        
        # Verify family tree exists and user has access
        family_tree = FamilyTree.query.get(family_tree_id)
        if not family_tree:
            return jsonify({'success': False, 'error': 'Family tree not found'}), 404
        
        # In production, create actual payment intent with Stripe
        payment_intent = {
            'id': f'pi_{uuid.uuid4().hex[:24]}',
            'client_secret': f'pi_{uuid.uuid4().hex[:24]}_secret_{uuid.uuid4().hex[:10]}',
            'amount': int(PAYMENT_PLANS[plan_type]['price'] * 100),  # Convert to cents
            'currency': 'usd',
            'status': 'requires_payment_method',
            'metadata': {
                'family_tree_id': family_tree_id,
                'plan_type': plan_type,
                'user_id': family_tree.owner_id
            }
        }
        
        return jsonify({
            'success': True,
            'payment_intent': payment_intent,
            'plan': PAYMENT_PLANS[plan_type]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@pdf_bp.route('/api/pdf/confirm-payment', methods=['POST'])
@cross_origin()
def confirm_payment():
    """Confirm payment and generate PDF"""
    try:
        data = request.get_json()
        payment_intent_id = data.get('payment_intent_id')
        family_tree_id = data.get('family_tree_id')
        plan_type = data.get('plan_type', 'basic')
        
        # In production, verify payment with Stripe
        # For demo, we'll simulate successful payment
        payment_verified = True
        
        if not payment_verified:
            return jsonify({'success': False, 'error': 'Payment verification failed'}), 400
        
        # Generate PDF
        family_tree = FamilyTree.query.get(family_tree_id)
        if not family_tree:
            return jsonify({'success': False, 'error': 'Family tree not found'}), 404
        
        pdf_path = generate_family_tree_pdf(family_tree, plan_type)
        
        # Create download token for secure access
        download_token = str(uuid.uuid4())
        
        # Store download info (in production, use Redis or database)
        download_info = {
            'pdf_path': pdf_path,
            'family_tree_id': family_tree_id,
            'plan_type': plan_type,
            'created_at': datetime.utcnow().isoformat(),
            'expires_at': (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }
        
        # In production, store this in a proper cache/database
        current_app.config.setdefault('PDF_DOWNLOADS', {})[download_token] = download_info
        
        return jsonify({
            'success': True,
            'download_token': download_token,
            'download_url': f'/api/pdf/download/{download_token}',
            'expires_in': 24 * 60 * 60  # 24 hours in seconds
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@pdf_bp.route('/api/pdf/download/<download_token>', methods=['GET'])
@cross_origin()
def download_pdf(download_token):
    """Download PDF using secure token"""
    try:
        downloads = current_app.config.get('PDF_DOWNLOADS', {})
        download_info = downloads.get(download_token)
        
        if not download_info:
            return jsonify({'success': False, 'error': 'Invalid or expired download token'}), 404
        
        # Check if token has expired
        expires_at = datetime.fromisoformat(download_info['expires_at'])
        if datetime.utcnow() > expires_at:
            # Clean up expired token
            del downloads[download_token]
            return jsonify({'success': False, 'error': 'Download token has expired'}), 410
        
        pdf_path = download_info['pdf_path']
        if not os.path.exists(pdf_path):
            return jsonify({'success': False, 'error': 'PDF file not found'}), 404
        
        # Get family tree for filename
        family_tree = FamilyTree.query.get(download_info['family_tree_id'])
        filename = f"{family_tree.name.replace(' ', '_')}_family_tree.pdf"
        
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_family_tree_pdf(family_tree, plan_type='basic'):
    """Generate PDF for family tree"""
    # Create PDF directory if it doesn't exist
    pdf_dir = os.path.join(current_app.root_path, 'generated_pdfs')
    os.makedirs(pdf_dir, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    filename = f"family_tree_{family_tree.id}_{timestamp}.pdf"
    pdf_path = os.path.join(pdf_dir, filename)
    
    # Create PDF document
    doc = SimpleDocTemplate(pdf_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#059669'),
        alignment=1  # Center alignment
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=20,
        textColor=colors.HexColor('#374151')
    )
    
    # Title page
    story.append(Paragraph(family_tree.name, title_style))
    story.append(Spacer(1, 20))
    
    if family_tree.description:
        story.append(Paragraph(family_tree.description, styles['Normal']))
        story.append(Spacer(1, 20))
    
    # Family tree information
    info_data = [
        ['Created by:', family_tree.owner.username],
        ['Created on:', family_tree.created_at.strftime('%B %d, %Y')],
        ['Last updated:', family_tree.updated_at.strftime('%B %d, %Y')],
        ['Total crosses:', str(len(family_tree.crosses))],
        ['Generations:', f"F1-F{max([cross.generation for cross in family_tree.crosses], default=1)}"]
    ]
    
    info_table = Table(info_data, colWidths=[2*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    story.append(info_table)
    story.append(Spacer(1, 30))
    
    # Crosses section
    story.append(Paragraph("Breeding History", subtitle_style))
    
    if family_tree.crosses:
        # Group crosses by generation
        crosses_by_gen = {}
        for cross in family_tree.crosses:
            gen = f"F{cross.generation}"
            if gen not in crosses_by_gen:
                crosses_by_gen[gen] = []
            crosses_by_gen[gen].append(cross)
        
        for generation in sorted(crosses_by_gen.keys()):
            story.append(Paragraph(f"{generation} Generation", styles['Heading3']))
            
            crosses_data = [['Parent 1', 'Parent 2', 'Offspring', 'Date', 'Notes']]
            
            for cross in crosses_by_gen[generation]:
                crosses_data.append([
                    cross.parent1_name,
                    cross.parent2_name,
                    cross.offspring_name,
                    cross.cross_date.strftime('%m/%d/%Y') if cross.cross_date else 'N/A',
                    cross.notes[:50] + '...' if cross.notes and len(cross.notes) > 50 else cross.notes or ''
                ])
            
            crosses_table = Table(crosses_data, colWidths=[1.2*inch, 1.2*inch, 1.2*inch, 0.8*inch, 2*inch])
            crosses_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            story.append(crosses_table)
            story.append(Spacer(1, 20))
    
    # Strain summary
    story.append(Paragraph("Strain Summary", subtitle_style))
    
    # Get all unique strains
    strains = set()
    for cross in family_tree.crosses:
        strains.add(cross.parent1_name)
        strains.add(cross.parent2_name)
        strains.add(cross.offspring_name)
    
    strain_list = sorted(list(strains))
    strain_text = ", ".join(strain_list)
    story.append(Paragraph(f"Strains involved: {strain_text}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Premium features
    if plan_type == 'premium':
        story.append(Paragraph("Breeding Analysis", subtitle_style))
        
        # Add breeding statistics
        stats_data = [
            ['Total unique strains:', str(len(strains))],
            ['Most used parent:', get_most_used_parent(family_tree.crosses)],
            ['Average generation:', f"F{sum([cross.generation for cross in family_tree.crosses]) / len(family_tree.crosses):.1f}"],
            ['Breeding timespan:', get_breeding_timespan(family_tree.crosses)]
        ]
        
        stats_table = Table(stats_data, colWidths=[2.5*inch, 2.5*inch])
        stats_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(stats_table)
        story.append(Spacer(1, 20))
    
    # Footer
    story.append(Spacer(1, 50))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=1
    )
    
    footer_text = f"Generated by StrainTree on {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p UTC')}"
    if plan_type == 'premium':
        footer_text += " | Premium Export"
    
    story.append(Paragraph(footer_text, footer_style))
    
    # Build PDF
    doc.build(story)
    
    return pdf_path

def get_most_used_parent(crosses):
    """Get the most frequently used parent strain"""
    parent_counts = {}
    for cross in crosses:
        parent_counts[cross.parent1_name] = parent_counts.get(cross.parent1_name, 0) + 1
        parent_counts[cross.parent2_name] = parent_counts.get(cross.parent2_name, 0) + 1
    
    if not parent_counts:
        return "N/A"
    
    most_used = max(parent_counts, key=parent_counts.get)
    return f"{most_used} ({parent_counts[most_used]} uses)"

def get_breeding_timespan(crosses):
    """Get the timespan of breeding activities"""
    if not crosses:
        return "N/A"
    
    dates = [cross.cross_date for cross in crosses if cross.cross_date]
    if not dates:
        return "N/A"
    
    earliest = min(dates)
    latest = max(dates)
    
    if earliest == latest:
        return earliest.strftime('%B %Y')
    
    return f"{earliest.strftime('%B %Y')} - {latest.strftime('%B %Y')}"

