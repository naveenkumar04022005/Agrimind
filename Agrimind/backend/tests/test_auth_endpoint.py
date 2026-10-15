import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from tests.test_base import BaseTestCase


class TestAuthEndpoint(BaseTestCase):
    def test_registration_success(self):
        """User can register with valid name, email, and password."""
        payload = {
            "name": "Ramesh Patel",
            "email": "ramesh@example.com",
            "password": "SecurePassword123!",
        }
        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "ramesh@example.com")
        self.assertEqual(data["user"]["role"], "farmer")

    def test_duplicate_registration_rejected(self):
        """Registration with an already existing email returns 409 Conflict."""
        self.create_test_user(email="duplicate@example.com")
        payload = {
            "name": "Another User",
            "email": "duplicate@example.com",
            "password": "AnotherPassword123!",
        }
        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 409)
        self.assertIn("already exists", res.json()["detail"].lower())

    def test_login_success(self):
        """User can log in with valid credentials and receive a JWT token."""
        self.create_test_user(email="login@example.com", password="SecretPassword123!")
        payload = {
            "email": "login@example.com",
            "password": "SecretPassword123!",
        }
        res = self.client.post("/api/auth/login", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")

    def test_login_invalid_password(self):
        """Logging in with an invalid password returns 401 Unauthorized."""
        self.create_test_user(email="login2@example.com", password="CorrectPassword123!")
        payload = {
            "email": "login2@example.com",
            "password": "WrongPassword!",
        }
        res = self.client.post("/api/auth/login", json=payload)
        self.assertEqual(res.status_code, 401)
        self.assertIn("invalid email or password", res.json()["detail"].lower())

    def test_get_me_authenticated(self):
        """Authenticated user can fetch their own profile with Bearer JWT."""
        user, token = self.create_test_user(email="me@example.com", name="Me Farmer")
        res = self.client.get(
            "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], user.id)
        self.assertEqual(data["email"], "me@example.com")
        self.assertEqual(data["name"], "Me Farmer")

    def test_get_me_unauthenticated(self):
        """Unauthenticated request to /api/auth/me returns 401."""
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.status_code, 401)

    def test_google_auth_new_and_existing_user(self):
        """Tests Google sign-in registers new user and logs in existing user."""
        # 1. New Google user registers
        res1 = self.client.post(
            "/api/auth/google",
            json={
                "email": "kisan.google@gmail.com",
                "name": "Kisan Google",
                "avatar_url": "https://lh3.googleusercontent.com/avatar123",
            },
        )
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        self.assertIn("access_token", data1)
        self.assertEqual(data1["user"]["email"], "kisan.google@gmail.com")
        self.assertEqual(data1["user"]["name"], "Kisan Google")

        # 2. Existing Google user signs in again
        res2 = self.client.post(
            "/api/auth/google",
            json={"email": "kisan.google@gmail.com"},
        )
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertIn("access_token", data2)
        self.assertEqual(data2["user"]["id"], data1["user"]["id"])


if __name__ == "__main__":
    unittest.main()
