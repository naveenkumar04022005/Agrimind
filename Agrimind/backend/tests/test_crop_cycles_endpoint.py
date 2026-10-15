import os
import sys
import unittest
from datetime import date, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from tests.test_base import BaseTestCase


class TestCropCyclesEndpoint(BaseTestCase):
    def test_crop_cycle_lifecycle(self):
        """Creates cycle, verifies day calculation, updates stage, and retrieves active cycle."""
        user, token = self.create_test_user(email="cycle_user@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        # Create farm
        res_farm = self.client.post(
            "/api/farms",
            json={"farm_name": "Wheat Field", "land_area": 5.0},
            headers=headers,
        )
        farm_id = res_farm.json()["id"]

        ten_days_ago = (date.today() - timedelta(days=10)).isoformat()
        payload = {
            "farm_id": farm_id,
            "cycle_name": "Rabi Wheat 2026",
            "crop_name": "Wheat",
            "area_planted_acres": 4.5,
            "sowing_date": ten_days_ago,
            "expected_duration_days": 120,
        }

        # 1. Create cycle
        res_create = self.client.post("/api/crops/cycles", json=payload, headers=headers)
        self.assertEqual(res_create.status_code, 201)
        created = res_create.json()
        cycle_id = created["id"]
        self.assertEqual(created["current_day"], 11)  # 10 days elapsed + 1

        # 2. Get active cycle
        res_cur = self.client.get("/api/crops/cycles/current", headers=headers)
        self.assertEqual(res_cur.status_code, 200)
        current = res_cur.json()
        self.assertIsNotNone(current)
        self.assertEqual(current["id"], cycle_id)
        self.assertEqual(current["cycle_name"], "Rabi Wheat 2026")

        # 3. Update stage
        res_up = self.client.put(
            f"/api/crops/cycles/{cycle_id}",
            json={"current_stage": "vegetative", "notes": "Healthy germination observed"},
            headers=headers,
        )
        self.assertEqual(res_up.status_code, 200)
        self.assertEqual(res_up.json()["current_stage"], "vegetative")


if __name__ == "__main__":
    unittest.main()
