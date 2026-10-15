import os
from typing import List
from dotenv import load_dotenv

# Load environment configurations
load_dotenv()
load_dotenv(".env")
load_dotenv("../.env")


class Settings:
    PROJECT_NAME: str = "Agrimind API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # PostgreSQL Database URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://agrimind:agrimind_password@localhost:5432/agrimind",
    )

    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", "agrimind_dev_secret_key_change_in_production_8943729857289357"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # Weather Provider (Open-Meteo)
    OPEN_METEO_BASE_URL: str = os.getenv(
        "OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1/forecast"
    )

    # File Uploads Directory
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"),
    )

    # CORS configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    @property
    def cors_origins(self) -> List[str]:
        origins = [
            self.FRONTEND_URL.rstrip("/"),
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        # Remove duplicates while preserving order
        return list(dict.fromkeys(origins))


settings = Settings()
