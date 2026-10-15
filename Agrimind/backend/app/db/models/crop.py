import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Date, JSON, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class Crop(Base):
    __tablename__ = "crops"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    scientific_name = Column(String(150), nullable=True)
    category = Column(String(50), nullable=False, default="cereals")
    min_temperature_celsius = Column(Float, nullable=True)
    max_temperature_celsius = Column(Float, nullable=True)
    min_rainfall_mm = Column(Float, nullable=True)
    max_rainfall_mm = Column(Float, nullable=True)
    ideal_ph_min = Column(Float, default=6.0, nullable=True)
    ideal_ph_max = Column(Float, default=7.5, nullable=True)
    growing_duration_days = Column(Integer, nullable=True)
    ideal_nitrogen_mg_kg = Column(Float, nullable=True)
    ideal_phosphorus_mg_kg = Column(Float, nullable=True)
    ideal_potassium_mg_kg = Column(Float, nullable=True)
    is_system_standard = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    crop_cycles = relationship("CropCycle", back_populates="crop")


class CropCycle(Base):
    __tablename__ = "crop_cycles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_id = Column(String(36), ForeignKey("crops.id", ondelete="SET NULL"), nullable=True)
    cycle_name = Column(String(150), nullable=False)
    area_planted_acres = Column(Float, nullable=False, default=1.0)
    sowing_date = Column(Date, default=date.today, nullable=False)
    expected_duration_days = Column(Integer, default=120, nullable=False)
    current_stage = Column(String(50), default="sown", nullable=False)  # sown, vegetative, flowering, maturity, harvested
    expected_harvest_date = Column(Date, nullable=True)
    actual_harvest_date = Column(Date, nullable=True)
    status = Column(String(50), default="sown", nullable=False)  # planned, sown, growing, flowering, harvesting, completed, failed
    actual_yield_kg = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="crop_cycles")
    crop = relationship("Crop", back_populates="crop_cycles")
    user = relationship("User", back_populates="crop_cycles")
    fertilizer_recommendations = relationship("FertilizerRecommendation", back_populates="crop_cycle")


class CropRecommendation(Base):
    __tablename__ = "crop_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recommended_crop_name = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=False)
    alternatives = Column(JSON, default=list, nullable=False)
    input_values = Column(JSON, default=dict, nullable=True)
    rationale = Column(Text, nullable=True)
    expected_yield_estimate_kg_acre = Column(Float, nullable=True)
    model_version = Column(String(50), default="v1.0.0", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="crop_recommendations")
    user = relationship("User", back_populates="crop_recommendations")


class FertilizerRecommendation(Base):
    __tablename__ = "fertilizer_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_cycle_id = Column(String(36), ForeignKey("crop_cycles.id", ondelete="SET NULL"), nullable=True)
    crop_name = Column(String(100), nullable=False)
    fertilizer_name = Column(String(150), nullable=False)
    recommended_dosage = Column(String(150), nullable=False)  # e.g., "50 kg/acre Urea"
    application_stage = Column(String(50), default="Basal", nullable=False)
    deficiency_detected = Column(JSON, default=dict, nullable=True)
    instructions = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="fertilizer_recommendations")
    user = relationship("User", back_populates="fertilizer_recommendations")
    crop_cycle = relationship("CropCycle", back_populates="fertilizer_recommendations")
