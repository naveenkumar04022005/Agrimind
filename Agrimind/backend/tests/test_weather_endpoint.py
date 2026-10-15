import os
import sys
import unittest
from unittest.mock import patch, AsyncMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from tests.test_base import BaseTestCase
from app.schemas.weather import WeatherResponse, WeatherLocation, CurrentWeather, DailyForecast
from app.db.models.weather import WeatherData


class TestWeatherEndpoint(BaseTestCase):
    def test_unauthenticated_weather_returns_401(self):
        """Unauthenticated call to /api/weather returns 401."""
        res = self.client.get("/api/weather")
        self.assertEqual(res.status_code, 401)

    def test_weather_without_farm_returns_404(self):
        """User without a registered farm gets 404."""
        user, token = self.create_test_user(email="nofarm@example.com")
        res = self.client.get(
            "/api/weather", headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(res.status_code, 404)

    def test_weather_success_and_snapshot_stored(self):
        """Authenticated farmer with coordinates retrieves weather and snapshot is stored."""
        user, token = self.create_test_user(email="weather_user@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        # Create farm with coordinates
        res_farm = self.client.post(
            "/api/farms",
            json={
                "farm_name": "Climate Farm",
                "latitude": 16.5123,
                "longitude": 80.5123,
                "land_area": 5.0,
            },
            headers=headers,
        )
        farm_id = res_farm.json()["id"]

        mock_weather_response = WeatherResponse(
            location=WeatherLocation(
                latitude=16.5123,
                longitude=80.5123,
            ),
            farm_id=farm_id,
            farm_name="Climate Farm",
            current=CurrentWeather(
                temperature=28.5,
                apparent_temperature=31.0,
                humidity=72,
                precipitation=0.0,
                wind_speed=12.5,
                weather_code=0,
                condition="Clear sky",
            ),
            daily=[],
        )

        with patch(
            "app.services.weather_service.weather_service.get_weather",
            new_callable=AsyncMock,
            return_value=mock_weather_response,
        ):
            res = self.client.get("/api/weather", headers=headers)
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["current"]["temperature"], 28.5)
            self.assertEqual(data["current"]["condition"], "Clear sky")

        # Verify WeatherData snapshot was recorded in local database
        snapshot = self.db.query(WeatherData).filter(WeatherData.farm_id == farm_id).first()
        self.assertIsNotNone(snapshot)
        self.assertEqual(snapshot.temperature, 28.5)


if __name__ == "__main__":
    unittest.main()
