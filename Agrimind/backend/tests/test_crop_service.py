import sys
import os
import unittest

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.crop_service import crop_service, CROPS_DATABASE
from app.schemas.crop import CropRecommendRequest


class TestCropService(unittest.IsolatedAsyncioTestCase):
    def test_crops_database_integrity(self):
        """Verifies crop agronomy database has valid properties across all crops."""
        self.assertGreaterEqual(len(CROPS_DATABASE), 12)
        for crop in CROPS_DATABASE:
            self.assertIn("name", crop)
            self.assertIn("category", crop)
            self.assertIn("n_range", crop)
            self.assertIn("p_range", crop)
            self.assertIn("k_range", crop)
            self.assertIn("ph_range", crop)
            self.assertIn("soil_types", crop)

    def test_rice_suitability_recommendation(self):
        """High moisture, warm, clayey soil strongly favors Rice."""
        results = crop_service.recommend_crops(
            nitrogen=85.0,
            phosphorus=50.0,
            potassium=40.0,
            ph=6.5,
            temperature=26.0,
            humidity=85.0,
            rainfall=220.0,
            soil_type="Clayey Alluvial",
        )
        self.assertGreaterEqual(len(results), 1)
        top_crop = results[0]
        self.assertIn("Rice", top_crop.crop_name)
        self.assertGreaterEqual(top_crop.confidence_pct, 80)
        self.assertEqual(top_crop.water_requirement, "High")

    def test_cotton_suitability_recommendation(self):
        """High nitrogen, black soil, moderate rainfall strongly favors Cotton."""
        results = crop_service.recommend_crops(
            nitrogen=120.0,
            phosphorus=45.0,
            potassium=20.0,
            ph=7.2,
            temperature=27.0,
            humidity=70.0,
            rainfall=80.0,
            soil_type="Deep Black Cotton Soil",
        )
        self.assertGreaterEqual(len(results), 1)
        crop_names = [c.crop_name for c in results]
        self.assertTrue(any("Cotton" in name for name in crop_names))

    def test_fertilizer_deficit_and_dosing(self):
        """Tests calculation of NPK deficits into commercial Urea, DAP, and MOP."""
        # Current soil is deficient: N=30 (target ~80), P=20 (target ~48), K=10 (target ~40)
        plan = crop_service.generate_fertilizer_plan(
            crop_name="Rice (Paddy)",
            current_n=30.0,
            current_p=20.0,
            current_k=10.0,
            ph=6.5,
        )
        self.assertEqual(plan.target_crop, "Rice (Paddy)")
        self.assertGreater(plan.nutrient_deficits["nitrogen_kg_ha"], 20.0)
        self.assertGreater(plan.nutrient_deficits["phosphorus_kg_ha"], 10.0)
        self.assertGreater(plan.nutrient_deficits["potassium_kg_ha"], 10.0)

        fert_names = [r.fertilizer_name for r in plan.recommendations]
        self.assertTrue(any("Urea" in f for f in fert_names))
        self.assertTrue(any("DAP" in f for f in fert_names))
        self.assertTrue(any("Potash" in f for f in fert_names))

    def test_acidic_soil_ph_assessment(self):
        """Low pH triggers agricultural lime recommendation."""
        plan = crop_service.generate_fertilizer_plan(
            crop_name="Maize (Corn)",
            current_n=70.0,
            current_p=45.0,
            current_k=20.0,
            ph=4.9,
        )
        self.assertIn("Acidic", plan.soil_health_assessment)
        self.assertTrue(any("Limestone" in a or "Lime" in a for a in plan.organic_amendments))

    async def test_execute_engine_with_defaults(self):
        """Engine executes successfully even with partial inputs."""
        req = CropRecommendRequest(
            nitrogen=70.0,
            ph=6.4,
            auto_fetch_farm_data=False,
        )
        res = await crop_service.execute_engine(request=req)
        self.assertGreaterEqual(len(res.recommended_crops), 3)
        self.assertIsNotNone(res.fertilizer_plan)
        self.assertIn("nitrogen", res.telemetry_source)


if __name__ == "__main__":
    unittest.main()
