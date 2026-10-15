"""
Base declarative configuration and aggregated models metadata for Alembic migrations.
"""
from app.db.database import Base
from app.db.models import (
    User,
    FarmerProfile,
    Farm,
    SoilData,
    Crop,
    CropCycle,
    CropRecommendation,
    FertilizerRecommendation,
    CropHealthReport,
    WeatherData,
    AIConversation,
    AIMessage,
)

__all__ = [
    "Base",
    "User",
    "FarmerProfile",
    "Farm",
    "SoilData",
    "Crop",
    "CropCycle",
    "CropRecommendation",
    "FertilizerRecommendation",
    "CropHealthReport",
    "WeatherData",
    "AIConversation",
    "AIMessage",
]
