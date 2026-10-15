import sys
import os
import unittest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.weather_service import (
    WeatherService,
    WeatherServiceException,
    _WEATHER_CACHE,
)
from app.utils.weather_codes import weather_code_to_condition
from app.schemas.weather import WeatherResponse


class TestWeatherService(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        # Clear in-memory cache between tests
        _WEATHER_CACHE.clear()
        self.service = WeatherService()

    def test_wmo_weather_code_mapping(self):
        """Test conversion of WMO weather codes to human-readable condition strings."""
        self.assertEqual(weather_code_to_condition(0), "Clear sky")
        self.assertEqual(weather_code_to_condition(1), "Mainly clear")
        self.assertEqual(weather_code_to_condition(2), "Partly cloudy")
        self.assertEqual(weather_code_to_condition(3), "Overcast")
        self.assertEqual(weather_code_to_condition(45), "Fog")
        self.assertEqual(weather_code_to_condition(51), "Light drizzle")
        self.assertEqual(weather_code_to_condition(61), "Slight rain")
        self.assertEqual(weather_code_to_condition(65), "Heavy rain")
        self.assertEqual(weather_code_to_condition(80), "Slight rain showers")
        self.assertEqual(weather_code_to_condition(95), "Thunderstorm")
        # Unknown code fallback
        self.assertEqual(weather_code_to_condition(999), "Variable conditions")

    def test_coordinate_validation_valid(self):
        """Test valid coordinates within spherical limits pass validation."""
        self.service.validate_coordinates(16.5, 80.5)
        self.service.validate_coordinates(-90.0, -180.0)
        self.service.validate_coordinates(90.0, 180.0)
        self.service.validate_coordinates(0.0, 0.0)

    def test_coordinate_validation_invalid_latitude(self):
        """Test coordinates with invalid latitude raise WeatherServiceException."""
        with self.assertRaises(WeatherServiceException) as ctx:
            self.service.validate_coordinates(95.0, 80.5)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Invalid latitude", ctx.exception.message)

        with self.assertRaises(WeatherServiceException) as ctx:
            self.service.validate_coordinates(-90.1, 80.5)
        self.assertEqual(ctx.exception.status_code, 400)

    def test_coordinate_validation_invalid_longitude(self):
        """Test coordinates with invalid longitude raise WeatherServiceException."""
        with self.assertRaises(WeatherServiceException) as ctx:
            self.service.validate_coordinates(16.5, 185.0)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Invalid longitude", ctx.exception.message)

        with self.assertRaises(WeatherServiceException) as ctx:
            self.service.validate_coordinates(16.5, -180.5)
        self.assertEqual(ctx.exception.status_code, 400)

    async def test_get_forecast_success(self):
        """Test parsing Open-Meteo response into WeatherResponse schema."""
        mock_response_data = {
            "latitude": 16.50,
            "longitude": 80.50,
            "current": {
                "temperature_2m": 32.4,
                "relative_humidity_2m": 68,
                "apparent_temperature": 38.1,
                "precipitation": 0.0,
                "wind_speed_10m": 12.5,
                "weather_code": 1,
            },
            "daily": {
                "time": ["2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27", "2026-09-28"],
                "weather_code": [1, 2, 61, 80, 95, 0, 1],
                "temperature_2m_max": [33.5, 34.0, 31.0, 29.5, 28.0, 32.0, 33.0],
                "temperature_2m_min": [24.0, 24.5, 23.0, 22.0, 21.5, 23.0, 24.0],
                "precipitation_sum": [0.0, 0.5, 8.2, 14.0, 25.0, 0.0, 0.0],
                "precipitation_probability_max": [10, 25, 75, 85, 90, 5, 10],
            },
        }

        mock_http_response = MagicMock()
        mock_http_response.status_code = 200
        mock_http_response.json.return_value = mock_response_data

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_http_response

        service = WeatherService(client=mock_client)
        result = await service.get_forecast(
            latitude=16.50,
            longitude=80.50,
            farm_id="farm-uuid-123",
            farm_name="Krishna Valley Paddy Farm",
        )

        self.assertIsInstance(result, WeatherResponse)
        self.assertEqual(result.farm_id, "farm-uuid-123")
        self.assertEqual(result.farm_name, "Krishna Valley Paddy Farm")
        self.assertEqual(result.current.temperature, 32.4)
        self.assertEqual(result.current.humidity, 68)
        self.assertEqual(result.current.condition, "Mainly clear")
        self.assertEqual(len(result.daily), 7)
        self.assertEqual(result.daily[0].temperature_max, 33.5)
        self.assertEqual(result.daily[2].condition, "Slight rain")
        self.assertEqual(result.daily[4].condition, "Thunderstorm")

    async def test_caching_behavior(self):
        """Test that subsequent requests to the same coordinates are served from cache."""
        mock_response_data = {
            "latitude": 16.50,
            "longitude": 80.50,
            "current": {
                "temperature_2m": 30.0,
                "relative_humidity_2m": 70,
                "apparent_temperature": 35.0,
                "precipitation": 0.0,
                "wind_speed_10m": 10.0,
                "weather_code": 0,
            },
            "daily": {
                "time": ["2026-09-22"],
                "weather_code": [0],
                "temperature_2m_max": [31.0],
                "temperature_2m_min": [22.0],
                "precipitation_sum": [0.0],
                "precipitation_probability_max": [0],
            },
        }

        mock_http_response = MagicMock()
        mock_http_response.status_code = 200
        mock_http_response.json.return_value = mock_response_data

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_http_response

        service = WeatherService(client=mock_client)

        # First request -> calls client.get
        res1 = await service.get_forecast(16.50, 80.50)
        self.assertEqual(mock_client.get.call_count, 1)

        # Second request with same coordinates -> served from cache without calling client.get
        res2 = await service.get_forecast(16.50, 80.50)
        self.assertEqual(mock_client.get.call_count, 1)
        self.assertEqual(res1.current.temperature, res2.current.temperature)

    async def test_open_meteo_http_error(self):
        """Test proper handling of 5xx error from Open-Meteo."""
        mock_http_response = MagicMock()
        mock_http_response.status_code = 503
        mock_http_response.text = "Service Unavailable"

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_http_response

        service = WeatherService(client=mock_client)
        with self.assertRaises(WeatherServiceException) as ctx:
            await service.get_forecast(16.50, 80.50)
        self.assertEqual(ctx.exception.status_code, 502)

    async def test_open_meteo_timeout(self):
        """Test proper handling of request timeout."""
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.TimeoutException("Connection timed out")

        service = WeatherService(client=mock_client)
        with self.assertRaises(WeatherServiceException) as ctx:
            await service.get_forecast(16.50, 80.50)
        self.assertEqual(ctx.exception.status_code, 504)


if __name__ == "__main__":
    unittest.main()
