from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CropRecommendRequest(BaseModel):
    """Input parameters for crop recommendation and fertilizer plan."""
    nitrogen: Optional[float] = Field(None, ge=0.0, le=500.0, description="Nitrogen ratio in kg/ha or mg/kg")
    phosphorus: Optional[float] = Field(None, ge=0.0, le=500.0, description="Phosphorus ratio in kg/ha or mg/kg")
    potassium: Optional[float] = Field(None, ge=0.0, le=500.0, description="Potassium ratio in kg/ha or mg/kg")
    ph: Optional[float] = Field(None, ge=0.0, le=14.0, description="Soil pH level (0-14)")
    temperature: Optional[float] = Field(None, description="Average temperature in degrees Celsius")
    humidity: Optional[float] = Field(None, ge=0.0, le=100.0, description="Relative humidity percentage")
    rainfall: Optional[float] = Field(None, ge=0.0, description="Annual or seasonal rainfall in mm")
    soil_type: Optional[str] = Field(None, description="Soil classification (e.g. Alluvial, Black, Clay, Loamy, Red, Sandy)")
    target_crop: Optional[str] = Field(None, description="Optional target crop for specific fertilizer recommendation")
    farm_id: Optional[str] = Field(None, description="Optional farm ID to automatically pull soil and weather data")
    auto_fetch_farm_data: bool = Field(True, description="Whether to automatically pull telemetry from farm if available")


class CropRecommendationItem(BaseModel):
    """Individual recommended crop with confidence score and agronomic profile."""
    crop_name: str
    confidence_pct: int
    category: str
    expected_yield_range: str
    water_requirement: str
    duration_days: int
    season: str
    suitable_soil_types: List[str]
    optimal_temperature: str
    description: str


class FertilizerItem(BaseModel):
    """Specific fertilizer application dosage and schedule."""
    fertilizer_name: str
    quantity_kg_per_acre: float
    schedule: str
    purpose: str


class FertilizerPlan(BaseModel):
    """Nutrient balance assessment and fertilizer recommendations."""
    target_crop: str
    soil_health_assessment: str
    nutrient_deficits: Dict[str, float]
    recommendations: List[FertilizerItem]
    organic_amendments: List[str]


class AgrimindEngineResponse(BaseModel):
    """Full recommendation engine response combining crop choices and fertilizer guidance."""
    recommended_crops: List[CropRecommendationItem]
    fertilizer_plan: Optional[FertilizerPlan] = None
    telemetry_source: Dict[str, Any]
    generated_at: str
