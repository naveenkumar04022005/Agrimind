from typing import List, Optional
from pydantic import BaseModel, Field


class WeatherLocation(BaseModel):
    latitude: float
    longitude: float


class CurrentWeather(BaseModel):
    temperature: float = Field(..., description="Temperature in degrees Celsius")
    humidity: int = Field(..., description="Relative humidity percentage")
    apparent_temperature: float = Field(..., description="Apparent / feels-like temperature in degrees Celsius")
    precipitation: float = Field(..., description="Precipitation amount in mm")
    wind_speed: float = Field(..., description="Wind speed in km/h")
    weather_code: int = Field(..., description="WMO weather code")
    condition: str = Field(..., description="Human-readable condition description")


class DailyForecast(BaseModel):
    date: str = Field(..., description="Forecast date in YYYY-MM-DD")
    temperature_max: float = Field(..., description="Maximum temperature in degrees Celsius")
    temperature_min: float = Field(..., description="Minimum temperature in degrees Celsius")
    precipitation: float = Field(..., description="Expected precipitation sum in mm")
    rain_probability: int = Field(..., description="Probability of precipitation percentage")
    weather_code: int = Field(..., description="WMO weather code")
    condition: str = Field(..., description="Human-readable condition description")


class WeatherResponse(BaseModel):
    location: WeatherLocation
    current: CurrentWeather
    daily: List[DailyForecast]
    farm_id: Optional[str] = None
    farm_name: Optional[str] = None
