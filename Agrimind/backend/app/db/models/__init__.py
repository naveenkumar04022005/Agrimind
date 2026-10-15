"""Database models package re-exporting all SQLAlchemy models."""
from app.db.database import Base
from app.db.models.user import User, FarmerProfile
from app.db.models.farm import Farm, SoilData
from app.db.models.crop import Crop, CropCycle, CropRecommendation, FertilizerRecommendation
from app.db.models.crop_health import CropHealthReport
from app.db.models.weather import WeatherData
from app.db.models.assistant import AIConversation, AIMessage

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
