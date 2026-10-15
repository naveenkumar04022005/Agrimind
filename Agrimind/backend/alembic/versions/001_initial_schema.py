"""Initial database schema with seed data

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-23 00:00:00.000000

"""
from typing import Sequence, Union
import uuid
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='farmer'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_users_email', 'users', ['email'])

    # 2. farmer_profiles
    op.create_table(
        'farmer_profiles',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('phone_number', sa.String(50), nullable=True),
        sa.Column('preferred_language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('country', sa.String(100), nullable=False, server_default='India'),
        sa.Column('state', sa.String(100), nullable=True),
        sa.Column('district', sa.String(100), nullable=True),
        sa.Column('village', sa.String(100), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 3. farms
    op.create_table(
        'farms',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('farm_name', sa.String(255), nullable=False),
        sa.Column('state', sa.String(100), nullable=True),
        sa.Column('district', sa.String(100), nullable=True),
        sa.Column('village', sa.String(100), nullable=True),
        sa.Column('land_area', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('soil_type', sa.String(50), nullable=True, server_default='loamy'),
        sa.Column('soil_ph', sa.Float(), nullable=True, server_default='6.5'),
        sa.Column('nitrogen', sa.Float(), nullable=True, server_default='120.0'),
        sa.Column('phosphorus', sa.Float(), nullable=True, server_default='50.0'),
        sa.Column('potassium', sa.Float(), nullable=True, server_default='50.0'),
        sa.Column('irrigation', sa.String(100), nullable=True, server_default='Drip Irrigation'),
        sa.Column('current_crop', sa.String(100), nullable=True, server_default='Wheat'),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint('latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)', name='check_latitude_range'),
        sa.CheckConstraint('longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)', name='check_longitude_range'),
        sa.CheckConstraint('land_area > 0', name='check_land_area_positive'),
    )
    op.create_index('idx_farms_user_id', 'farms', ['user_id'])
    op.create_index('idx_farms_geo', 'farms', ['latitude', 'longitude'])

    # 4. soil_data
    op.create_table(
        'soil_data',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('test_date', sa.Date(), nullable=False, server_default=sa.func.current_date()),
        sa.Column('sample_depth_cm', sa.Float(), nullable=True, server_default='15.0'),
        sa.Column('nitrogen_mg_kg', sa.Float(), nullable=False, server_default='120.0'),
        sa.Column('phosphorus_mg_kg', sa.Float(), nullable=False, server_default='50.0'),
        sa.Column('potassium_mg_kg', sa.Float(), nullable=False, server_default='50.0'),
        sa.Column('ph_level', sa.Float(), nullable=False, server_default='6.5'),
        sa.Column('organic_matter_pct', sa.Float(), nullable=True, server_default='1.5'),
        sa.Column('electrical_conductivity', sa.Float(), nullable=True),
        sa.Column('moisture_pct', sa.Float(), nullable=True),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint('ph_level >= 0.0 AND ph_level <= 14.0', name='check_ph_range'),
        sa.CheckConstraint('nitrogen_mg_kg >= 0', name='check_n_positive'),
        sa.CheckConstraint('phosphorus_mg_kg >= 0', name='check_p_positive'),
        sa.CheckConstraint('potassium_mg_kg >= 0', name='check_k_positive'),
    )
    op.create_index('idx_soil_data_farm_id', 'soil_data', ['farm_id'])

    # 5. crops
    crops_table = op.create_table(
        'crops',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('scientific_name', sa.String(150), nullable=True),
        sa.Column('category', sa.String(50), nullable=False, server_default='cereals'),
        sa.Column('min_temperature_celsius', sa.Float(), nullable=True),
        sa.Column('max_temperature_celsius', sa.Float(), nullable=True),
        sa.Column('min_rainfall_mm', sa.Float(), nullable=True),
        sa.Column('max_rainfall_mm', sa.Float(), nullable=True),
        sa.Column('ideal_ph_min', sa.Float(), nullable=True, server_default='6.0'),
        sa.Column('ideal_ph_max', sa.Float(), nullable=True, server_default='7.5'),
        sa.Column('growing_duration_days', sa.Integer(), nullable=True),
        sa.Column('ideal_nitrogen_mg_kg', sa.Float(), nullable=True),
        sa.Column('ideal_phosphorus_mg_kg', sa.Float(), nullable=True),
        sa.Column('ideal_potassium_mg_kg', sa.Float(), nullable=True),
        sa.Column('is_system_standard', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_crops_name', 'crops', ['name'])

    # Seed standard agricultural crops
    op.bulk_insert(
        crops_table,
        [
            {
                'id': str(uuid.uuid4()),
                'name': 'Rice (Paddy)',
                'scientific_name': 'Oryza sativa',
                'category': 'cereals',
                'min_temperature_celsius': 20.0,
                'max_temperature_celsius': 37.0,
                'min_rainfall_mm': 1000.0,
                'max_rainfall_mm': 2500.0,
                'ideal_ph_min': 5.5,
                'ideal_ph_max': 7.0,
                'growing_duration_days': 120,
                'ideal_nitrogen_mg_kg': 100.0,
                'ideal_phosphorus_mg_kg': 40.0,
                'ideal_potassium_mg_kg': 40.0,
                'is_system_standard': True,
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Wheat',
                'scientific_name': 'Triticum aestivum',
                'category': 'cereals',
                'min_temperature_celsius': 10.0,
                'max_temperature_celsius': 25.0,
                'min_rainfall_mm': 400.0,
                'max_rainfall_mm': 900.0,
                'ideal_ph_min': 6.0,
                'ideal_ph_max': 7.5,
                'growing_duration_days': 140,
                'ideal_nitrogen_mg_kg': 120.0,
                'ideal_phosphorus_mg_kg': 60.0,
                'ideal_potassium_mg_kg': 40.0,
                'is_system_standard': True,
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Maize (Corn)',
                'scientific_name': 'Zea mays',
                'category': 'cereals',
                'min_temperature_celsius': 18.0,
                'max_temperature_celsius': 32.0,
                'min_rainfall_mm': 500.0,
                'max_rainfall_mm': 1000.0,
                'ideal_ph_min': 5.8,
                'ideal_ph_max': 7.2,
                'growing_duration_days': 110,
                'ideal_nitrogen_mg_kg': 120.0,
                'ideal_phosphorus_mg_kg': 60.0,
                'ideal_potassium_mg_kg': 50.0,
                'is_system_standard': True,
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Cotton',
                'scientific_name': 'Gossypium hirsutum',
                'category': 'fiber',
                'min_temperature_celsius': 21.0,
                'max_temperature_celsius': 35.0,
                'min_rainfall_mm': 500.0,
                'max_rainfall_mm': 1100.0,
                'ideal_ph_min': 5.8,
                'ideal_ph_max': 8.0,
                'growing_duration_days': 180,
                'ideal_nitrogen_mg_kg': 100.0,
                'ideal_phosphorus_mg_kg': 50.0,
                'ideal_potassium_mg_kg': 50.0,
                'is_system_standard': True,
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Sugarcane',
                'scientific_name': 'Saccharum officinarum',
                'category': 'cash_crop',
                'min_temperature_celsius': 20.0,
                'max_temperature_celsius': 35.0,
                'min_rainfall_mm': 1100.0,
                'max_rainfall_mm': 2200.0,
                'ideal_ph_min': 6.0,
                'ideal_ph_max': 7.5,
                'growing_duration_days': 360,
                'ideal_nitrogen_mg_kg': 250.0,
                'ideal_phosphorus_mg_kg': 100.0,
                'ideal_potassium_mg_kg': 120.0,
                'is_system_standard': True,
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Tomato',
                'scientific_name': 'Solanum lycopersicum',
                'category': 'vegetables',
                'min_temperature_celsius': 18.0,
                'max_temperature_celsius': 30.0,
                'min_rainfall_mm': 400.0,
                'max_rainfall_mm': 700.0,
                'ideal_ph_min': 6.0,
                'ideal_ph_max': 6.8,
                'growing_duration_days': 90,
                'ideal_nitrogen_mg_kg': 100.0,
                'ideal_phosphorus_mg_kg': 60.0,
                'ideal_potassium_mg_kg': 80.0,
                'is_system_standard': True,
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Potato',
                'scientific_name': 'Solanum tuberosum',
                'category': 'vegetables',
                'min_temperature_celsius': 15.0,
                'max_temperature_celsius': 24.0,
                'min_rainfall_mm': 500.0,
                'max_rainfall_mm': 800.0,
                'ideal_ph_min': 5.0,
                'ideal_ph_max': 6.5,
                'growing_duration_days': 100,
                'ideal_nitrogen_mg_kg': 150.0,
                'ideal_phosphorus_mg_kg': 80.0,
                'ideal_potassium_mg_kg': 100.0,
                'is_system_standard': True,
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Groundnut (Peanut)',
                'scientific_name': 'Arachis hypogaea',
                'category': 'oilseeds',
                'min_temperature_celsius': 22.0,
                'max_temperature_celsius': 30.0,
                'min_rainfall_mm': 500.0,
                'max_rainfall_mm': 1000.0,
                'ideal_ph_min': 5.5,
                'ideal_ph_max': 6.5,
                'growing_duration_days': 120,
                'ideal_nitrogen_mg_kg': 20.0,
                'ideal_phosphorus_mg_kg': 40.0,
                'ideal_potassium_mg_kg': 50.0,
                'is_system_standard': True,
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Soybean',
                'scientific_name': 'Glycine max',
                'category': 'pulses',
                'min_temperature_celsius': 20.0,
                'max_temperature_celsius': 30.0,
                'min_rainfall_mm': 600.0,
                'max_rainfall_mm': 1000.0,
                'ideal_ph_min': 6.0,
                'ideal_ph_max': 7.0,
                'growing_duration_days': 110,
                'ideal_nitrogen_mg_kg': 30.0,
                'ideal_phosphorus_mg_kg': 60.0,
                'ideal_potassium_mg_kg': 40.0,
                'is_system_standard': True,
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Coffee (Arabica)',
                'scientific_name': 'Coffea arabica',
                'category': 'plantation',
                'min_temperature_celsius': 15.0,
                'max_temperature_celsius': 24.0,
                'min_rainfall_mm': 1200.0,
                'max_rainfall_mm': 2000.0,
                'ideal_ph_min': 5.5,
                'ideal_ph_max': 6.5,
                'growing_duration_days': 270,
                'ideal_nitrogen_mg_kg': 140.0,
                'ideal_phosphorus_mg_kg': 40.0,
                'ideal_potassium_mg_kg': 140.0,
                'is_system_standard': True,
            },
        ]
    )

    # 6. crop_cycles
    op.create_table(
        'crop_cycles',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_id', sa.String(36), sa.ForeignKey('crops.id', ondelete='SET NULL'), nullable=True),
        sa.Column('cycle_name', sa.String(150), nullable=False),
        sa.Column('area_planted_acres', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('sowing_date', sa.Date(), nullable=False),
        sa.Column('expected_duration_days', sa.Integer(), nullable=False, server_default='120'),
        sa.Column('current_stage', sa.String(50), nullable=False, server_default='sown'),
        sa.Column('expected_harvest_date', sa.Date(), nullable=True),
        sa.Column('actual_harvest_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='sown'),
        sa.Column('actual_yield_kg', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_crop_cycles_farm', 'crop_cycles', ['farm_id'])
    op.create_index('idx_crop_cycles_user', 'crop_cycles', ['user_id'])

    # 7. crop_recommendations
    op.create_table(
        'crop_recommendations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('recommended_crop_name', sa.String(100), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('alternatives', sa.JSON(), nullable=False),
        sa.Column('input_values', sa.JSON(), nullable=True),
        sa.Column('rationale', sa.Text(), nullable=True),
        sa.Column('expected_yield_estimate_kg_acre', sa.Float(), nullable=True),
        sa.Column('model_version', sa.String(50), nullable=False, server_default='v1.0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_crop_rec_user_farm', 'crop_recommendations', ['user_id', 'farm_id'])

    # 8. fertilizer_recommendations
    op.create_table(
        'fertilizer_recommendations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_cycle_id', sa.String(36), sa.ForeignKey('crop_cycles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('crop_name', sa.String(100), nullable=False),
        sa.Column('fertilizer_name', sa.String(150), nullable=False),
        sa.Column('recommended_dosage', sa.String(150), nullable=False),
        sa.Column('application_stage', sa.String(50), nullable=False, server_default='Basal'),
        sa.Column('deficiency_detected', sa.JSON(), nullable=True),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_fert_rec_user_farm', 'fertilizer_recommendations', ['user_id', 'farm_id'])

    # 9. crop_health_reports
    op.create_table(
        'crop_health_reports',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('image_path', sa.String(500), nullable=False),
        sa.Column('crop', sa.String(100), nullable=False, server_default='General'),
        sa.Column('detected_condition', sa.String(150), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='0.95'),
        sa.Column('severity', sa.String(50), nullable=False, server_default='low'),
        sa.Column('recommendation', sa.Text(), nullable=True),
        sa.Column('symptoms', sa.JSON(), nullable=True),
        sa.Column('organic_treatment', sa.Text(), nullable=True),
        sa.Column('chemical_treatment', sa.Text(), nullable=True),
        sa.Column('preventive_measures', sa.Text(), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_health_reports_user', 'crop_health_reports', ['user_id'])

    # 10. weather_data
    op.create_table(
        'weather_data',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('temperature', sa.Float(), nullable=False),
        sa.Column('humidity', sa.Float(), nullable=False),
        sa.Column('precipitation', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('wind_speed', sa.Float(), nullable=True),
        sa.Column('weather_code', sa.Integer(), nullable=True),
        sa.Column('weather_description', sa.String(100), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_weather_farm_rec', 'weather_data', ['farm_id', 'recorded_at'])

    # 11. ai_conversations
    op.create_table(
        'ai_conversations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='SET NULL'), nullable=True),
        sa.Column('title', sa.String(255), nullable=False, server_default='Agronomy Consultation'),
        sa.Column('context_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_ai_conv_user', 'ai_conversations', ['user_id'])

    # 12. ai_messages
    op.create_table(
        'ai_messages',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('conversation_id', sa.String(36), sa.ForeignKey('ai_conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_ai_messages_conv', 'ai_messages', ['conversation_id', 'created_at'])


def downgrade() -> None:
    op.drop_table('ai_messages')
    op.drop_table('ai_conversations')
    op.drop_table('weather_data')
    op.drop_table('crop_health_reports')
    op.drop_table('fertilizer_recommendations')
    op.drop_table('crop_recommendations')
    op.drop_table('crop_cycles')
    op.drop_table('crops')
    op.drop_table('soil_data')
    op.drop_table('farms')
    op.drop_table('farmer_profiles')
    op.drop_table('users')
