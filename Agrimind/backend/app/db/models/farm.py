import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Date, CheckConstraint
from sqlalchemy.orm import relationship, validates

from app.db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_name = Column(String(255), nullable=False)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    village = Column(String(100), nullable=True)
    land_area = Column(Float, nullable=False, default=1.0)
    soil_type = Column(String(50), nullable=True, default="loamy")
    soil_ph = Column(Float, nullable=True, default=6.5)
    nitrogen = Column(Float, nullable=True, default=120.0)
    phosphorus = Column(Float, nullable=True, default=50.0)
    potassium = Column(Float, nullable=True, default=50.0)
    irrigation = Column(String(100), nullable=True, default="Drip Irrigation")
    current_crop = Column(String(100), nullable=True, default="Wheat")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)", name="check_latitude_range"),
        CheckConstraint("longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)", name="check_longitude_range"),
        CheckConstraint("land_area > 0", name="check_land_area_positive"),
    )

    @validates("latitude")
    def validate_latitude(self, key, value):
        if value is not None:
            val = float(value)
            if not (-90.0 <= val <= 90.0):
                raise ValueError("Latitude must be between -90 and 90 degrees.")
            return val
        return None

    @validates("longitude")
    def validate_longitude(self, key, value):
        if value is not None:
            val = float(value)
            if not (-180.0 <= val <= 180.0):
                raise ValueError("Longitude must be between -180 and 180 degrees.")
            return val
        return None

    # Relationships
    user = relationship("User", back_populates="farms")
    soil_data = relationship("SoilData", back_populates="farm", cascade="all, delete-orphan")
    crop_cycles = relationship("CropCycle", back_populates="farm", cascade="all, delete-orphan")
    crop_recommendations = relationship("CropRecommendation", back_populates="farm", cascade="all, delete-orphan")
    fertilizer_recommendations = relationship("FertilizerRecommendation", back_populates="farm", cascade="all, delete-orphan")
    crop_health_reports = relationship("CropHealthReport", back_populates="farm", cascade="all, delete-orphan")
    weather_data = relationship("WeatherData", back_populates="farm", cascade="all, delete-orphan")


class SoilData(Base):
    __tablename__ = "soil_data"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    test_date = Column(Date, default=date.today, nullable=False)
    sample_depth_cm = Column(Float, default=15.0, nullable=True)
    nitrogen_mg_kg = Column(Float, nullable=False, default=120.0)
    phosphorus_mg_kg = Column(Float, nullable=False, default=50.0)
    potassium_mg_kg = Column(Float, nullable=False, default=50.0)
    ph_level = Column(Float, nullable=False, default=6.5)
    organic_matter_pct = Column(Float, nullable=True, default=1.5)
    electrical_conductivity = Column(Float, nullable=True)
    moisture_pct = Column(Float, nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("ph_level >= 0.0 AND ph_level <= 14.0", name="check_ph_range"),
        CheckConstraint("nitrogen_mg_kg >= 0", name="check_n_positive"),
        CheckConstraint("phosphorus_mg_kg >= 0", name="check_p_positive"),
        CheckConstraint("potassium_mg_kg >= 0", name="check_k_positive"),
    )

    farm = relationship("Farm", back_populates="soil_data")
