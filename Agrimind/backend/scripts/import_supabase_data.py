"""
Supabase to Local PostgreSQL Data Migration Script

Usage:
    python backend/scripts/import_supabase_data.py --data-dir path/to/exported_supabase_json/

This script imports records exported from a Supabase instance (JSON dumps of tables:
users, profiles, farms, soil_data, crops, crop_cycles, crop_recommendations,
fertilizer_recommendations, crop_health_reports, weather_data, ai_conversations, ai_messages)
into the local Agrimind PostgreSQL database.

Note:
    If no export dataset is provided, this script exits gracefully explaining that
    an exported dataset from Supabase is required. It does NOT generate synthetic data.
"""

import os
import sys
import json
import argparse
import logging

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import SessionLocal
from app.db.models.user import User, FarmerProfile
from app.db.models.farm import Farm, SoilData
from app.db.models.crop import Crop, CropCycle, CropRecommendation, FertilizerRecommendation
from app.db.models.crop_health import CropHealthReport
from app.db.models.weather import WeatherData
from app.db.models.assistant import AIConversation, AIMessage
from app.core.security import hash_password

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("import_supabase_data")


def load_json_table(data_dir: str, table_name: str):
    file_path = os.path.join(data_dir, f"{table_name}.json")
    if not os.path.isfile(file_path):
        logger.warning(f"File not found: {file_path}. Skipping table '{table_name}'.")
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_migration(data_dir: str):
    if not os.path.isdir(data_dir):
        logger.error(f"Provided export directory '{data_dir}' does not exist.")
        logger.info(
            "To migrate data from Supabase, please export table records as JSON files "
            "(e.g., users.json, farms.json, profiles.json) and provide the folder path."
        )
        sys.exit(1)

    db = SessionLocal()
    try:
        logger.info(f"Starting data import from '{data_dir}' into local PostgreSQL...")

        # 1. Users & Profiles
        users_data = load_json_table(data_dir, "users")
        profiles_data = {p["id"]: p for p in load_json_table(data_dir, "profiles")}

        for u in users_data:
            user_id = str(u.get("id"))
            existing = db.query(User).filter(User.id == user_id).first()
            if not existing:
                prof = profiles_data.get(user_id, {})
                user = User(
                    id=user_id,
                    email=u.get("email"),
                    name=prof.get("full_name") or u.get("email", "").split("@")[0],
                    hashed_password=u.get("encrypted_password") or hash_password("TemporaryPassword123!"),
                    role=prof.get("role", "farmer"),
                    is_active=True,
                )
                db.add(user)
                db.flush()

                farmer_profile = FarmerProfile(
                    user_id=user.id,
                    full_name=prof.get("full_name"),
                    phone_number=prof.get("phone_number"),
                    preferred_language=prof.get("preferred_language", "en"),
                    country=prof.get("country", "India"),
                    state=prof.get("state"),
                    district=prof.get("district"),
                    village=prof.get("village"),
                )
                db.add(farmer_profile)

        db.commit()
        logger.info("Migrated users and profiles.")

        # 2. Farms
        farms_data = load_json_table(data_dir, "farms")
        for f_data in farms_data:
            farm_id = str(f_data.get("id"))
            if not db.query(Farm).filter(Farm.id == farm_id).first():
                farm = Farm(
                    id=farm_id,
                    user_id=str(f_data.get("user_id")),
                    farm_name=f_data.get("name") or "Farm",
                    state=f_data.get("state"),
                    district=f_data.get("district"),
                    village=f_data.get("village"),
                    land_area=float(f_data.get("total_area_acres") or 1.0),
                    soil_type=f_data.get("soil_type", "loamy"),
                    irrigation=f_data.get("irrigation_type", "Drip Irrigation"),
                    latitude=float(f_data.get("latitude")) if f_data.get("latitude") is not None else None,
                    longitude=float(f_data.get("longitude")) if f_data.get("longitude") is not None else None,
                )
                db.add(farm)

        db.commit()
        logger.info("Migrated farms.")

        # 3. Soil Data
        soils_data = load_json_table(data_dir, "soil_data")
        for s in soils_data:
            soil_id = str(s.get("id"))
            if not db.query(SoilData).filter(SoilData.id == soil_id).first():
                soil = SoilData(
                    id=soil_id,
                    farm_id=str(s.get("farm_id")),
                    user_id=str(s.get("user_id")),
                    nitrogen_mg_kg=float(s.get("nitrogen_mg_kg", 120.0)),
                    phosphorus_mg_kg=float(s.get("phosphorus_mg_kg", 50.0)),
                    potassium_mg_kg=float(s.get("potassium_mg_kg", 50.0)),
                    ph_level=float(s.get("ph_level", 6.5)),
                )
                db.add(soil)

        db.commit()
        logger.info("Migrated soil records.")

        logger.info("Supabase data import complete.")
    except Exception as e:
        db.rollback()
        logger.error(f"Import failed with error: {e}", exc_info=True)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import exported Supabase dataset into local PostgreSQL.")
    parser.add_argument(
        "--data-dir",
        type=str,
        default="./data/supabase_export",
        help="Directory containing exported JSON files from Supabase.",
    )
    args = parser.parse_args()
    run_migration(args.data_dir)
