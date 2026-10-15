from typing import Optional
from datetime import date
from pydantic import BaseModel, Field


class CropCycleCreate(BaseModel):
    farm_id: Optional[str] = None
    cycle_name: str = Field(..., min_length=1, max_length=150)
    crop_name: Optional[str] = None
    area_planted_acres: float = Field(1.0, ge=0.01)
    sowing_date: date = Field(default_factory=date.today)
    expected_duration_days: int = Field(120, ge=1)
    notes: Optional[str] = None


class CropCycleUpdate(BaseModel):
    current_stage: Optional[str] = None
    status: Optional[str] = None
    actual_harvest_date: Optional[date] = None
    actual_yield_kg: Optional[float] = None
    notes: Optional[str] = None


class CropCycleResponse(BaseModel):
    id: str
    farm_id: str
    user_id: str
    cycle_name: str
    area_planted_acres: float
    sowing_date: str
    expected_duration_days: int
    current_day: int
    current_stage: str
    expected_harvest_date: Optional[str] = None
    actual_harvest_date: Optional[str] = None
    status: str
    actual_yield_kg: Optional[float] = None
    notes: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
