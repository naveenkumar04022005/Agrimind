import os
import sys
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import Base, get_db
from app.core.security import hash_password, create_access_token
from app.db.models.user import User, FarmerProfile


class BaseTestCase(unittest.TestCase):
    """
    Base test case establishing an isolated in-memory SQLite database for tests.
    """

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=cls.engine
        )
        Base.metadata.create_all(bind=cls.engine)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)

    def setUp(self):
        self.db = self.TestingSessionLocal()

        def override_get_db():
            try:
                yield self.db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        self.db.rollback()
        # Clean tables
        for table in reversed(Base.metadata.sorted_tables):
            self.db.execute(table.delete())
        self.db.commit()
        self.db.close()
        app.dependency_overrides.clear()

    def create_test_user(
        self,
        email: str = "farmer@test.com",
        password: str = "Password123!",
        name: str = "Test Farmer",
    ) -> tuple[User, str]:
        """Creates a test user and returns (user, jwt_token)."""
        hashed = hash_password(password)
        user = User(
            email=email.lower().strip(),
            name=name,
            hashed_password=hashed,
            role="farmer",
            is_active=True,
        )
        self.db.add(user)
        self.db.flush()

        profile = FarmerProfile(
            user_id=user.id,
            full_name=name,
            state="Andhra Pradesh",
            district="Guntur",
            village="Amaravati",
        )
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(user)

        token = create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role}
        )
        return user, token
