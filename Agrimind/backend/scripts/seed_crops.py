import os
import sys
import uuid

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import SessionLocal, engine, Base
import app.db.models
from app.db.models.crop import Crop

SEED_CROPS = [
    {
        "id": str(uuid.uuid4()),
        "name": "Rice",
        "scientific_name": "Oryza sativa",
        "category": "cereals",
        "min_temperature_celsius": 20.0,
        "max_temperature_celsius": 38.0,
        "min_rainfall_mm": 1000.0,
        "max_rainfall_mm": 2500.0,
        "ideal_ph_min": 5.5,
        "ideal_ph_max": 7.0,
        "growing_duration_days": 120,
        "ideal_nitrogen_mg_kg": 80.0,
        "ideal_phosphorus_mg_kg": 40.0,
        "ideal_potassium_mg_kg": 40.0,
        "is_system_standard": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Wheat",
        "scientific_name": "Triticum aestivum",
        "category": "cereals",
        "min_temperature_celsius": 12.0,
        "max_temperature_celsius": 25.0,
        "min_rainfall_mm": 350.0,
        "max_rainfall_mm": 750.0,
        "ideal_ph_min": 6.0,
        "ideal_ph_max": 7.5,
        "growing_duration_days": 140,
        "ideal_nitrogen_mg_kg": 120.0,
        "ideal_phosphorus_mg_kg": 60.0,
        "ideal_potassium_mg_kg": 40.0,
        "is_system_standard": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Maize",
        "scientific_name": "Zea mays",
        "category": "cereals",
        "min_temperature_celsius": 18.0,
        "max_temperature_celsius": 32.0,
        "min_rainfall_mm": 500.0,
        "max_rainfall_mm": 900.0,
        "ideal_ph_min": 5.8,
        "ideal_ph_max": 7.2,
        "growing_duration_days": 100,
        "ideal_nitrogen_mg_kg": 120.0,
        "ideal_phosphorus_mg_kg": 60.0,
        "ideal_potassium_mg_kg": 50.0,
        "is_system_standard": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Cotton",
        "scientific_name": "Gossypium hirsutum",
        "category": "fiber",
        "min_temperature_celsius": 21.0,
        "max_temperature_celsius": 35.0,
        "min_rainfall_mm": 500.0,
        "max_rainfall_mm": 1100.0,
        "ideal_ph_min": 5.8,
        "ideal_ph_max": 8.0,
        "growing_duration_days": 180,
        "ideal_nitrogen_mg_kg": 100.0,
        "ideal_phosphorus_mg_kg": 50.0,
        "ideal_potassium_mg_kg": 50.0,
        "is_system_standard": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Sugarcane",
        "scientific_name": "Saccharum officinarum",
        "category": "cash_crop",
        "min_temperature_celsius": 20.0,
        "max_temperature_celsius": 35.0,
        "min_rainfall_mm": 1100.0,
        "max_rainfall_mm": 2200.0,
        "ideal_ph_min": 6.0,
        "ideal_ph_max": 7.5,
        "growing_duration_days": 360,
        "ideal_nitrogen_mg_kg": 250.0,
        "ideal_phosphorus_mg_kg": 100.0,
        "ideal_potassium_mg_kg": 120.0,
        "is_system_standard": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Tomato",
        "scientific_name": "Solanum lycopersicum",
        "category": "vegetables",
        "min_temperature_celsius": 18.0,
        "max_temperature_celsius": 30.0,
        "min_rainfall_mm": 400.0,
        "max_rainfall_mm": 700.0,
        "ideal_ph_min": 6.0,
        "ideal_ph_max": 6.8,
        "growing_duration_days": 90,
        "ideal_nitrogen_mg_kg": 100.0,
        "ideal_phosphorus_mg_kg": 60.0,
        "ideal_potassium_mg_kg": 80.0,
        "is_system_standard": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Potato",
        "scientific_name": "Solanum tuberosum",
        "category": "vegetables",
        "min_temperature_celsius": 15.0,
        "max_temperature_celsius": 24.0,
        "min_rainfall_mm": 500.0,
        "max_rainfall_mm": 800.0,
        "ideal_ph_min": 5.0,
        "ideal_ph_max": 6.5,
        "growing_duration_days": 100,
        "ideal_nitrogen_mg_kg": 150.0,
        "ideal_phosphorus_mg_kg": 80.0,
        "ideal_potassium_mg_kg": 100.0,
        "is_system_standard": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Chilli",
        "scientific_name": "Capsicum annuum",
        "category": "spices",
        "min_temperature_celsius": 20.0,
        "max_temperature_celsius": 32.0,
        "min_rainfall_mm": 600.0,
        "max_rainfall_mm": 1000.0,
        "ideal_ph_min": 6.0,
        "ideal_ph_max": 7.0,
        "growing_duration_days": 150,
        "ideal_nitrogen_mg_kg": 120.0,
        "ideal_phosphorus_mg_kg": 60.0,
        "ideal_potassium_mg_kg": 60.0,
        "is_system_standard": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Groundnut",
        "scientific_name": "Arachis hypogaea",
        "category": "oilseeds",
        "min_temperature_celsius": 22.0,
        "max_temperature_celsius": 32.0,
        "min_rainfall_mm": 500.0,
        "max_rainfall_mm": 750.0,
        "ideal_ph_min": 6.0,
        "ideal_ph_max": 7.0,
        "growing_duration_days": 120,
        "ideal_nitrogen_mg_kg": 20.0,
        "ideal_phosphorus_mg_kg": 40.0,
        "ideal_potassium_mg_kg": 40.0,
        "is_system_standard": True,
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Soybean",
        "scientific_name": "Glycine max",
        "category": "oilseeds",
        "min_temperature_celsius": 20.0,
        "max_temperature_celsius": 30.0,
        "min_rainfall_mm": 600.0,
        "max_rainfall_mm": 1000.0,
        "ideal_ph_min": 6.0,
        "ideal_ph_max": 7.0,
        "growing_duration_days": 110,
        "ideal_nitrogen_mg_kg": 30.0,
        "ideal_phosphorus_mg_kg": 60.0,
        "ideal_potassium_mg_kg": 40.0,
        "is_system_standard": True,
    },
]

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(Crop).count()
        if existing == 0:
            for crop_data in SEED_CROPS:
                crop = Crop(**crop_data)
                db.add(crop)
            db.commit()
            print(f"Successfully seeded {len(SEED_CROPS)} standard crops into database.")
        else:
            print(f"Database already contains {existing} crops. Seeding skipped.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
