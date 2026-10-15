from typing import Optional
from pydantic import BaseModel, Field, field_validator


class FarmBase(BaseModel):
    farm_name: str = Field(..., min_length=1, max_length=200, description="Name of the farm")
    state: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    village: Optional[str] = Field(None, max_length=100)
    land_area: Optional[float] = Field(None, ge=0.0, description="Total land area in acres")
    soil_type: Optional[str] = Field(None, max_length=50)
    soil_ph: Optional[float] = Field(None, ge=0.0, le=14.0, description="Soil pH level (0-14)")
    nitrogen: Optional[float] = Field(None, ge=0.0, description="Soil nitrogen content (mg/kg or kg/ha)")
    phosphorus: Optional[float] = Field(None, ge=0.0, description="Soil phosphorus content (mg/kg or kg/ha)")
    potassium: Optional[float] = Field(None, ge=0.0, description="Soil potassium content (mg/kg or kg/ha)")
    irrigation: Optional[str] = Field(None, max_length=50, description="Irrigation method (e.g. drip, sprinkler, rainfed)")
    current_crop: Optional[str] = Field(None, max_length=100, description="Primary crop currently cultivated")
    latitude: Optional[float] = Field(None, description="GPS Latitude (-90 to 90)")
    longitude: Optional[float] = Field(None, description="GPS Longitude (-180 to 180)")

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-90.0 <= v <= 90.0):
            raise ValueError("Latitude must be between -90 and 90 degrees.")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-180.0 <= v <= 180.0):
            raise ValueError("Longitude must be between -180 and 180 degrees.")
        return v


class FarmCreate(FarmBase):
    """Schema for creating a new farm record."""
    pass


class FarmUpdate(BaseModel):
    """Schema for updating an existing farm record."""
    farm_name: Optional[str] = Field(None, min_length=1, max_length=200)
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    land_area: Optional[float] = Field(None, ge=0.0)
    soil_type: Optional[str] = None
    soil_ph: Optional[float] = Field(None, ge=0.0, le=14.0)
    nitrogen: Optional[float] = Field(None, ge=0.0)
    phosphorus: Optional[float] = Field(None, ge=0.0)
    potassium: Optional[float] = Field(None, ge=0.0)
    irrigation: Optional[str] = None
    current_crop: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-90.0 <= v <= 90.0):
            raise ValueError("Latitude must be between -90 and 90 degrees.")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-180.0 <= v <= 180.0):
            raise ValueError("Longitude must be between -180 and 180 degrees.")
        return v


class FarmResponse(BaseModel):
    """Schema for returning farm details."""
    id: str
    user_id: str
    farm_name: str
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    land_area: Optional[float] = None
    soil_type: Optional[str] = None
    soil_ph: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    irrigation: Optional[str] = None
    current_crop: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
