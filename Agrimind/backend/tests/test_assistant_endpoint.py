import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from tests.test_base import BaseTestCase


class TestAssistantEndpoint(BaseTestCase):
    def test_unauthenticated_chat_returns_401(self):
        """Unauthenticated user cannot chat with assistant."""
        res = self.client.post("/api/assistant/chat", json={"message": "Hello"})
        self.assertEqual(res.status_code, 401)

    def test_assistant_chat_flow_and_history(self):
        """User chats with assistant, receives contextual advice, and conversation history is persisted."""
        user, token = self.create_test_user(email="assistant_user@example.com", name="Kisan Patel")
        headers = {"Authorization": f"Bearer {token}"}

        # Create farm for context
        self.client.post(
            "/api/farms",
            json={
                "farm_name": "Patel Paddy Field",
                "current_crop": "Rice (Paddy)",
                "soil_ph": 6.2,
                "nitrogen": 95.0,
                "land_area": 6.0,
            },
            headers=headers,
        )

        # 1. Send chat message
        res_chat = self.client.post(
            "/api/assistant/chat",
            json={"message": "What fertilizer should I apply for my rice crop?"},
            headers=headers,
        )
        self.assertEqual(res_chat.status_code, 200)
        data = res_chat.json()
        self.assertIn("conversation_id", data)
        self.assertIn("response", data)
        self.assertEqual(data["role"], "assistant")
        conv_id = data["conversation_id"]

        # 2. List conversations
        res_list = self.client.get("/api/assistant/conversations", headers=headers)
        self.assertEqual(res_list.status_code, 200)
        convs = res_list.json()
        self.assertEqual(len(convs), 1)
        self.assertEqual(convs[0]["id"], conv_id)

        # 3. Retrieve conversation by ID
        res_get = self.client.get(
            f"/api/assistant/conversations/{conv_id}", headers=headers
        )
        self.assertEqual(res_get.status_code, 200)
        conv_detail = res_get.json()
        self.assertEqual(len(conv_detail["messages"]), 2)  # user + assistant

        # 4. Delete conversation
        res_del = self.client.delete(
            f"/api/assistant/conversations/{conv_id}", headers=headers
        )
        self.assertEqual(res_del.status_code, 200)


if __name__ == "__main__":
    unittest.main()
