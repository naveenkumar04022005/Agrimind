import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models.user import User
from app.db.models.weather import WeatherData
from app.schemas.weather import WeatherResponse
from app.services.farm_service import farm_service
from app.services.weather_service import weather_service, WeatherServiceException

logger = logging.getLogger("agrimind.api.weather")

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get(
    "",
    response_model=WeatherResponse,
    summary="Get agricultural weather telemetry and 7-day forecast for the authenticated farmer's farm",
)
@router.get(
    "/",
    response_model=WeatherResponse,
    include_in_schema=False,
)
async def get_weather(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WeatherResponse:
    """
    Retrieves weather forecast for the authenticated farmer's farm.
    Flow:
      1. get_current_user() validates Bearer token and returns User.
      2. farm_service.get_user_farm() retrieves farmer's registered farm from PostgreSQL.
      3. Validates latitude & longitude.
      4. Calls Open-Meteo weather service.
      5. Sensibly persists weather snapshot to PostgreSQL if last recorded > 1 hour ago.
      6. Returns WeatherResponse to client.
    """
    farm = farm_service.get_user_farm(user_id=current_user.id, db=db)

    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No farm profile found for this farmer. Please create your farm profile first.",
        )

    latitude = farm.latitude
    longitude = farm.longitude

    if latitude is None or longitude is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Farm coordinates are not configured. Please update your farm profile with latitude and longitude.",
        )

    try:
        weather = await weather_service.get_weather(
            latitude=float(latitude),
            longitude=float(longitude),
            farm_id=farm.id,
            farm_name=farm.farm_name,
        )

        # Weather snapshot storage strategy: persist snapshot at most once every hour per farm
        now_utc = datetime.now(timezone.utc)
        one_hour_ago = now_utc - timedelta(hours=1)
        recent_record = (
            db.query(WeatherData)
            .filter(
                WeatherData.farm_id == farm.id,
                WeatherData.recorded_at >= one_hour_ago,
            )
            .first()
        )

        if not recent_record and weather.current:
            snapshot = WeatherData(
                farm_id=farm.id,
                temperature=weather.current.temperature,
                humidity=weather.current.humidity,
                precipitation=weather.current.precipitation,
                wind_speed=weather.current.wind_speed,
                weather_code=weather.current.weather_code,
                weather_description=getattr(weather.current, "condition", None),
                recorded_at=now_utc,
            )
            db.add(snapshot)
            db.commit()

        return weather
    except WeatherServiceException as e:
        logger.error(f"WeatherServiceException: {e.message} (status: {e.status_code})")
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
        )
    except Exception as e:
        logger.error(f"Unexpected error retrieving weather: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while retrieving meteorological data.",
        )
