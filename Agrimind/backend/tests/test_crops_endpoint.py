import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from tests.test_base import BaseTestCase
from app.db.models.crop import CropRecommendation, FertilizerRecommendation


class TestCropsEndpoint(BaseTestCase):
    def test_unauthenticated_crops_recommend_returns_401(self):
        """Unauthenticated user cannot access recommendation engine."""
        res = self.client.post("/api/crops/recommend", json={})
        self.assertEqual(res.status_code, 401)

    def test_crop_recommendation_and_storage(self):
        """Authenticated farmer receives ML recommendations and record is stored in database."""
        user, token = self.create_test_user(email="crops_user@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        # Create farm
        res_farm = self.client.post(
            "/api/farms",
            json={
                "farm_name": "Agro Valley",
                "land_area": 4.0,
                "soil_type": "alluvial",
                "soil_ph": 6.8,
                "nitrogen": 110.0,
                "phosphorus": 50.0,
                "potassium": 45.0,
            },
            headers=headers,
        )
        farm_id = res_farm.json()["id"]

        payload = {
            "farm_id": farm_id,
            "nitrogen": 110.0,
            "phosphorus": 50.0,
            "potassium": 45.0,
            "ph": 6.8,
            "temperature": 27.5,
            "humidity": 75.0,
            "rainfall": 180.0,
            "soil_type": "alluvial",
            "auto_fetch_farm_data": False,
        }

        res = self.client.post("/api/crops/recommend", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(len(data["recommended_crops"]) > 0)

        # Verify recommendation record stored in local database
        rec_in_db = (
            self.db.query(CropRecommendation)
            .filter(CropRecommendation.user_id == user.id)
            .first()
        )
        self.assertIsNotNone(rec_in_db)
        self.assertEqual(
            rec_in_db.recommended_crop_name, data["recommended_crops"][0]["crop_name"]
        )

        # Test history retrieval
        res_history = self.client.get("/api/crops/history", headers=headers)
        self.assertEqual(res_history.status_code, 200)
        history = res_history.json()
        self.assertEqual(len(history), 1)

    def test_fertilizer_recommendation_and_storage(self):
        """Farmer receives tailored fertilizer dosage and record is stored in database."""
        user, token = self.create_test_user(email="fert_user@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "crop": "Wheat",
            "growth_stage": "Vegetative",
            "farm_area_acres": 2.5,
            "nitrogen": 70.0,
            "phosphorus": 35.0,
            "potassium": 35.0,
            "soil_ph": 6.5,
        }

        res = self.client.post("/api/fertilizer/recommend", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["crop"], "Wheat")
        self.assertIn("Urea", data["fertilizer_name"])
        self.assertIn("Nitrogen", data["deficiency_detected"])


if __name__ == "__main__":
    unittest.main()
