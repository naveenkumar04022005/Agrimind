import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from tests.test_base import BaseTestCase


class TestFarmsEndpoint(BaseTestCase):
    def test_unauthenticated_farms_me(self):
        """Requesting /api/farms/me without token returns 401."""
        response = self.client.get("/api/farms/me")
        self.assertEqual(response.status_code, 401)

    def test_create_and_get_farm_success(self):
        """Authenticated farmer creates a farm and retrieves it via /api/farms/me."""
        user, token = self.create_test_user(email="farmer1@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "farm_name": "Green Valley Organic",
            "state": "Andhra Pradesh",
            "district": "Guntur",
            "village": "Amaravati",
            "land_area": 8.5,
            "soil_type": "loamy",
            "soil_ph": 6.8,
            "nitrogen": 135.0,
            "phosphorus": 55.0,
            "potassium": 60.0,
            "irrigation": "Drip Irrigation",
            "current_crop": "Tomato",
            "latitude": 16.5123,
            "longitude": 80.5123,
        }

        # Create farm
        res_create = self.client.post("/api/farms", json=payload, headers=headers)
        self.assertEqual(res_create.status_code, 201)
        created = res_create.json()
        self.assertEqual(created["farm_name"], "Green Valley Organic")
        self.assertEqual(created["user_id"], user.id)
        self.assertEqual(created["latitude"], 16.5123)
        self.assertEqual(created["longitude"], 80.5123)

        # Retrieve farm via /api/farms/me
        res_get = self.client.get("/api/farms/me", headers=headers)
        self.assertEqual(res_get.status_code, 200)
        fetched = res_get.json()
        self.assertEqual(fetched["id"], created["id"])
        self.assertEqual(fetched["farm_name"], "Green Valley Organic")

    def test_update_my_farm(self):
        """Farmer updates their farm profile via PUT /api/farms/me."""
        user, token = self.create_test_user(email="farmer2@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        # Create initial farm
        self.client.post(
            "/api/farms",
            json={"farm_name": "Old Farm Name", "land_area": 4.0},
            headers=headers,
        )

        # Update farm
        res_update = self.client.put(
            "/api/farms/me",
            json={"farm_name": "Updated Farm Name", "land_area": 6.0},
            headers=headers,
        )
        self.assertEqual(res_update.status_code, 200)
        updated = res_update.json()
        self.assertEqual(updated["farm_name"], "Updated Farm Name")
        self.assertEqual(updated["land_area"], 6.0)

    def test_user_a_cannot_access_user_b_farm(self):
        """User A is forbidden (403) from accessing User B's farm by ID."""
        user_a, token_a = self.create_test_user(email="user_a@example.com")
        user_b, token_b = self.create_test_user(email="user_b@example.com")

        # User B creates a farm
        res_b = self.client.post(
            "/api/farms",
            json={"farm_name": "User B Secret Farm", "land_area": 10.0},
            headers={"Authorization": f"Bearer {token_b}"},
        )
        farm_b_id = res_b.json()["id"]

        # User A attempts to access User B's farm by ID
        res_access = self.client.get(
            f"/api/farms/{farm_b_id}",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        self.assertEqual(res_access.status_code, 403)
        self.assertIn("access denied", res_access.json()["detail"].lower())

    def test_invalid_coordinates_validation(self):
        """Fails when latitude is out of [-90, 90] or longitude is out of [-180, 180]."""
        user, token = self.create_test_user(email="coords@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        # Invalid latitude (> 90)
        res_lat = self.client.post(
            "/api/farms",
            json={"farm_name": "Bad Lat", "latitude": 95.0, "longitude": 80.0},
            headers=headers,
        )
        self.assertEqual(res_lat.status_code, 422)

        # Invalid longitude (> 180)
        res_lon = self.client.post(
            "/api/farms",
            json={"farm_name": "Bad Lon", "latitude": 15.0, "longitude": 185.0},
            headers=headers,
        )
        self.assertEqual(res_lon.status_code, 422)


if __name__ == "__main__":
    unittest.main()
