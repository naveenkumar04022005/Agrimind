import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from tests.test_base import BaseTestCase
from app.db.models.crop_health import CropHealthReport


class TestCropHealthEndpoint(BaseTestCase):
    def test_unauthenticated_crop_health_returns_401(self):
        """Unauthenticated leaf upload returns 401."""
        res = self.client.post("/api/crop-health/analyze")
        self.assertEqual(res.status_code, 401)

    def test_invalid_image_type_rejected(self):
        """Uploading text file instead of image returns 400."""
        user, token = self.create_test_user(email="health_bad@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        file_content = b"Not an image"
        files = {"file": ("malicious.txt", file_content, "text/plain")}
        res = self.client.post("/api/crop-health/analyze", files=files, headers=headers)
        self.assertEqual(res.status_code, 400)

    def test_valid_image_upload_and_diagnosis(self):
        """Valid leaf image is processed, diagnosed, and recorded in database."""
        user, token = self.create_test_user(email="health_user@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        # Create dummy JPEG binary content
        fake_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb" + b"\x00" * 50
        files = {"file": ("tomato_leaf.jpg", fake_jpeg, "image/jpeg")}
        data = {"crop": "Tomato"}

        res = self.client.post(
            "/api/crop-health/analyze", files=files, data=data, headers=headers
        )
        self.assertEqual(res.status_code, 201)
        resp_data = res.json()
        self.assertEqual(resp_data["crop"], "Tomato")
        self.assertIn("Early Blight", resp_data["detected_condition"])
        self.assertIn("uploads/", resp_data["image_url"])

        # Verify in database
        report = (
            self.db.query(CropHealthReport)
            .filter(CropHealthReport.user_id == user.id)
            .first()
        )
        self.assertIsNotNone(report)
        self.assertEqual(report.crop, "Tomato")

        # Test listing reports
        res_list = self.client.get("/api/crop-health/reports", headers=headers)
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.json()), 1)


if __name__ == "__main__":
    unittest.main()
