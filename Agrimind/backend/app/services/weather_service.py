import time
import logging
from typing import Dict, Any, Optional
import httpx

from app.core.config import settings
from app.schemas.weather import (
    WeatherResponse,
    WeatherLocation,
    CurrentWeather,
    DailyForecast,
)
from app.utils.weather_codes import weather_code_to_condition

logger = logging.getLogger("agrimind.weather")

# Cache structure: key -> (timestamp, WeatherResponse)
_WEATHER_CACHE: Dict[str, tuple[float, WeatherResponse]] = {}
CACHE_TTL_SECONDS = 600  # 10 minutes cache TTL


class WeatherServiceException(Exception):
    """Custom exception raised when weather data retrieval fails."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class WeatherService:
    """
    Agricultural weather telemetry service interfacing with Open-Meteo.
    """

    def __init__(self, client: Optional[httpx.AsyncClient] = None):
        self._client = client

    def _get_cache_key(self, latitude: float, longitude: float) -> str:
        """Computes a spatial cache key rounded to 4 decimal places (~11 meters)."""
        return f"{round(latitude, 4)}:{round(longitude, 4)}"

    def _get_cached_weather(self, latitude: float, longitude: float) -> Optional[WeatherResponse]:
        key = self._get_cache_key(latitude, longitude)
        if key in _WEATHER_CACHE:
            timestamp, cached_data = _WEATHER_CACHE[key]
            if time.time() - timestamp < CACHE_TTL_SECONDS:
                logger.info(f"Serving weather from cache for coordinates: ({latitude}, {longitude})")
                return cached_data
            else:
                del _WEATHER_CACHE[key]
        return None

    def _set_cached_weather(self, latitude: float, longitude: float, data: WeatherResponse) -> None:
        key = self._get_cache_key(latitude, longitude)
        _WEATHER_CACHE[key] = (time.time(), data)

    def validate_coordinates(self, latitude: float, longitude: float) -> None:
        """Validates that coordinates are within permissible spherical ranges."""
        if not (-90.0 <= latitude <= 90.0):
            raise WeatherServiceException(
                f"Invalid latitude {latitude}. Latitude must be between -90 and 90 degrees.",
                status_code=400,
            )
        if not (-180.0 <= longitude <= 180.0):
            raise WeatherServiceException(
                f"Invalid longitude {longitude}. Longitude must be between -180 and 180 degrees.",
                status_code=400,
            )

    async def get_weather(
        self,
        latitude: float,
        longitude: float,
        farm_id: Optional[str] = None,
        farm_name: Optional[str] = None,
    ) -> WeatherResponse:
        """
        Fetches real-time weather and 7-day daily forecast from Open-Meteo API.
        Does not use hardcoded coordinates or fixed timezone.
        """
        self.validate_coordinates(latitude, longitude)

        # Check in-memory spatial cache
        cached = self._get_cached_weather(latitude, longitude)
        if cached:
            return WeatherResponse(
                location=cached.location,
                current=cached.current,
                daily=cached.daily,
                farm_id=farm_id or cached.farm_id,
                farm_name=farm_name or cached.farm_name,
            )

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
            "forecast_days": 7,
            "timezone": "auto",
        }

        endpoint_url = settings.OPEN_METEO_BASE_URL

        try:
            if self._client:
                response = await self._client.get(endpoint_url, params=params, timeout=10.0)
            else:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(endpoint_url, params=params)

            if response.status_code != 200:
                logger.error(
                    f"Open-Meteo returned HTTP {response.status_code}: {response.text}"
                )
                raise WeatherServiceException(
                    f"Open-Meteo service error: HTTP {response.status_code}",
                    status_code=502,
                )

            try:
                data = response.json()
            except Exception as e:
                logger.error(f"Failed to parse Open-Meteo JSON response: {e}")
                raise WeatherServiceException(
                    "Received invalid response format from weather provider.",
                    status_code=502,
                )

        except httpx.TimeoutException:
            logger.error("Open-Meteo request timed out.")
            raise WeatherServiceException(
                "Weather service request timed out. Please try again.",
                status_code=504,
            )
        except httpx.RequestError as e:
            logger.error(f"Network error while connecting to Open-Meteo: {e}")
            raise WeatherServiceException(
                "Could not connect to weather provider. Please verify network connectivity.",
                status_code=502,
            )

        # Parse current weather telemetry
        current_data = data.get("current", {})
        if not isinstance(current_data, dict):
            current_data = {}

        current_code = int(current_data.get("weather_code", 0))
        current_weather = CurrentWeather(
            temperature=float(current_data.get("temperature_2m", 0.0)),
            humidity=int(current_data.get("relative_humidity_2m", 0)),
            apparent_temperature=float(current_data.get("apparent_temperature", 0.0)),
            precipitation=float(current_data.get("precipitation", 0.0)),
            wind_speed=float(current_data.get("wind_speed_10m", 0.0)),
            weather_code=current_code,
            condition=weather_code_to_condition(current_code),
        )

        # Parse 7-day daily forecast
        daily_data = data.get("daily", {})
        if not isinstance(daily_data, dict):
            daily_data = {}

        dates = daily_data.get("time", [])
        codes = daily_data.get("weather_code", [])
        temp_maxs = daily_data.get("temperature_2m_max", [])
        temp_mins = daily_data.get("temperature_2m_min", [])
        precips = daily_data.get("precipitation_sum", [])
        rain_probs = daily_data.get("precipitation_probability_max", [])

        daily_forecasts = []
        for i in range(len(dates)):
            w_code = int(codes[i]) if i < len(codes) else 0
            daily_forecasts.append(
                DailyForecast(
                    date=dates[i],
                    temperature_max=float(temp_maxs[i]) if i < len(temp_maxs) else 0.0,
                    temperature_min=float(temp_mins[i]) if i < len(temp_mins) else 0.0,
                    precipitation=float(precips[i]) if i < len(precips) else 0.0,
                    rain_probability=int(rain_probs[i]) if i < len(rain_probs) and rain_probs[i] is not None else 0,
                    weather_code=w_code,
                    condition=weather_code_to_condition(w_code),
                )
            )

        result = WeatherResponse(
            location=WeatherLocation(
                latitude=float(data.get("latitude", latitude)),
                longitude=float(data.get("longitude", longitude)),
            ),
            current=current_weather,
            daily=daily_forecasts,
            farm_id=farm_id,
            farm_name=farm_name,
        )

        # Cache valid response
        self._set_cached_weather(latitude, longitude, result)
        return result

    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        farm_id: Optional[str] = None,
        farm_name: Optional[str] = None,
    ) -> WeatherResponse:
        """Alias for get_weather."""
        return await self.get_weather(latitude, longitude, farm_id, farm_name)


# Global singleton instance
weather_service = WeatherService()


# Top-level reusable function
async def get_weather(
    latitude: float,
    longitude: float,
    farm_id: Optional[str] = None,
    farm_name: Optional[str] = None,
) -> WeatherResponse:
    """
    Reusable function calling Open-Meteo forecast API with latitude and longitude.
    """
    return await weather_service.get_weather(latitude, longitude, farm_id, farm_name)
