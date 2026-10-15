from typing import Optional, List
from pydantic import BaseModel


class CropHealthResponse(BaseModel):
    id: str
    farm_id: Optional[str] = None
    crop: str
    detected_condition: str
    confidence_score: float
    severity: str
    recommendation: Optional[str] = None
    symptoms: List[str] = []
    organic_treatment: Optional[str] = None
    chemical_treatment: Optional[str] = None
    preventive_measures: Optional[str] = None
    image_url: str
    created_at: str

    class Config:
        from_attributes = True
