from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class FertilizerRecommendRequest(BaseModel):
    crop: str = Field(..., description="Crop name (e.g. Rice, Wheat, Tomato)")
    growth_stage: str = Field("Basal", description="Growth stage (e.g. Basal, Vegetative, Flowering, Maturity)")
    farm_area_acres: float = Field(1.0, ge=0.1, description="Farm area in acres")
    nitrogen: Optional[float] = Field(None, ge=0.0, description="Soil N in mg/kg or kg/ha")
    phosphorus: Optional[float] = Field(None, ge=0.0, description="Soil P in mg/kg or kg/ha")
    potassium: Optional[float] = Field(None, ge=0.0, description="Soil K in mg/kg or kg/ha")
    soil_ph: Optional[float] = Field(None, ge=0.0, le=14.0, description="Soil pH")
    farm_id: Optional[str] = None


class FertilizerRecommendResponse(BaseModel):
    crop: str
    growth_stage: str
    farm_area_acres: float
    fertilizer_name: str
    recommended_dosage: str
    total_quantity_needed: str
    application_instructions: str
    deficiency_detected: Dict[str, Any]
    organic_alternatives: List[str]
    created_at: str
