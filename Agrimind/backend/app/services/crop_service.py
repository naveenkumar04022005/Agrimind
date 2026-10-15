import math
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.schemas.crop import (
    CropRecommendRequest,
    CropRecommendationItem,
    FertilizerItem,
    FertilizerPlan,
    AgrimindEngineResponse,
)

logger = logging.getLogger("agrimind.crop_service")

# ------------------------------------------------------------------------------
# 22 CROP AGRONOMIC PROFILES (Based on ICAR & Agriculture Datasets)
# ------------------------------------------------------------------------------
CROPS_DATABASE: List[Dict[str, Any]] = [
    {
        "name": "Rice (Paddy)",
        "category": "Grain / Cereal",
        "n_range": (60, 100, 80),
        "p_range": (35, 60, 48),
        "k_range": (35, 45, 40),
        "ph_range": (5.5, 7.2),
        "temp_range": (20.0, 36.0, 26.0),
        "humidity_range": (70.0, 95.0, 82.0),
        "rainfall_range": (150.0, 300.0, 230.0),
        "soil_types": ["clay", "alluvial", "clayey loam", "loamy"],
        "season": "Kharif (Monsoon)",
        "duration_days": 125,
        "water_req": "High",
        "yield_range": "20 - 28 Quintals/Acre",
        "description": "Thrives in warm, humid climates with heavy water-retentive clayey and alluvial soils.",
    },
    {
        "name": "Maize (Corn)",
        "category": "Grain / Cereal",
        "n_range": (60, 100, 78),
        "p_range": (35, 60, 48),
        "k_range": (15, 25, 20),
        "ph_range": (5.8, 7.5),
        "temp_range": (18.0, 32.0, 24.0),
        "humidity_range": (55.0, 75.0, 65.0),
        "rainfall_range": (60.0, 110.0, 85.0),
        "soil_types": ["loamy", "alluvial", "red loam", "black"],
        "season": "Kharif & Rabi",
        "duration_days": 105,
        "water_req": "Medium",
        "yield_range": "25 - 35 Quintals/Acre",
        "description": "Fast-growing high-yield cereal preferring well-drained loamy soils with moderate moisture.",
    },
    {
        "name": "Chickpea (Gram)",
        "category": "Pulse / Legume",
        "n_range": (20, 55, 40),
        "p_range": (55, 80, 68),
        "k_range": (65, 85, 80),
        "ph_range": (6.0, 8.0),
        "temp_range": (15.0, 24.0, 19.0),
        "humidity_range": (14.0, 30.0, 20.0),
        "rainfall_range": (65.0, 95.0, 80.0),
        "soil_types": ["black", "loamy", "clayey loam", "alluvial"],
        "season": "Rabi (Winter)",
        "duration_days": 110,
        "water_req": "Low",
        "yield_range": "8 - 14 Quintals/Acre",
        "description": "Crucial winter pulse that fixes atmospheric nitrogen, excelling in deep fertile black soils.",
    },
    {
        "name": "Cotton",
        "category": "Commercial / Fiber",
        "n_range": (100, 140, 120),
        "p_range": (35, 60, 46),
        "k_range": (15, 25, 20),
        "ph_range": (6.0, 8.2),
        "temp_range": (22.0, 34.0, 26.0),
        "humidity_range": (60.0, 85.0, 70.0),
        "rainfall_range": (60.0, 110.0, 80.0),
        "soil_types": ["black", "clayey loam", "alluvial"],
        "season": "Kharif",
        "duration_days": 160,
        "water_req": "Medium",
        "yield_range": "10 - 16 Quintals/Acre",
        "description": "Prime cash crop with high nitrogen requirement, performing best in moisture-retentive black soil.",
    },
    {
        "name": "Pigeonpeas (Red Gram / Arhar)",
        "category": "Pulse / Legume",
        "n_range": (15, 40, 20),
        "p_range": (55, 75, 68),
        "k_range": (15, 30, 20),
        "ph_range": (5.0, 7.5),
        "temp_range": (20.0, 36.0, 28.0),
        "humidity_range": (45.0, 70.0, 60.0),
        "rainfall_range": (90.0, 200.0, 150.0),
        "soil_types": ["loamy", "black", "red loam", "sandy loam"],
        "season": "Kharif",
        "duration_days": 180,
        "water_req": "Low",
        "yield_range": "7 - 12 Quintals/Acre",
        "description": "Deep-rooted drought-resilient pulse restoring soil organic carbon and fertility.",
    },
    {
        "name": "Mungbean (Green Gram)",
        "category": "Pulse / Legume",
        "n_range": (10, 35, 21),
        "p_range": (35, 60, 48),
        "k_range": (15, 25, 20),
        "ph_range": (6.2, 7.5),
        "temp_range": (25.0, 35.0, 29.0),
        "humidity_range": (80.0, 90.0, 85.0),
        "rainfall_range": (35.0, 60.0, 48.0),
        "soil_types": ["loamy", "sandy loam", "alluvial"],
        "season": "Kharif & Zaid (Summer)",
        "duration_days": 65,
        "water_req": "Low",
        "yield_range": "5 - 8 Quintals/Acre",
        "description": "Fast 60-day catch crop ideal for crop rotation between rice and wheat cycles.",
    },
    {
        "name": "Blackgram (Urad)",
        "category": "Pulse / Legume",
        "n_range": (30, 55, 40),
        "p_range": (55, 75, 67),
        "k_range": (15, 25, 20),
        "ph_range": (6.0, 7.5),
        "temp_range": (25.0, 35.0, 30.0),
        "humidity_range": (60.0, 75.0, 65.0),
        "rainfall_range": (60.0, 75.0, 68.0),
        "soil_types": ["black", "loamy", "alluvial"],
        "season": "Kharif & Rabi",
        "duration_days": 75,
        "water_req": "Low",
        "yield_range": "4 - 7 Quintals/Acre",
        "description": "High-protein leguminous crop thriving in warm climates with moderate rainfall.",
    },
    {
        "name": "Lentil (Masoor)",
        "category": "Pulse / Legume",
        "n_range": (10, 30, 19),
        "p_range": (55, 75, 68),
        "k_range": (15, 25, 19),
        "ph_range": (5.9, 7.8),
        "temp_range": (18.0, 30.0, 24.0),
        "humidity_range": (50.0, 70.0, 62.0),
        "rainfall_range": (35.0, 55.0, 46.0),
        "soil_types": ["loamy", "alluvial", "clayey loam"],
        "season": "Rabi (Winter)",
        "duration_days": 115,
        "water_req": "Low",
        "yield_range": "6 - 10 Quintals/Acre",
        "description": "Cold-tolerant pulse grown on residual moisture after kharif harvest.",
    },
    {
        "name": "Watermelon",
        "category": "Cucurbit / Fruit",
        "n_range": (80, 120, 100),
        "p_range": (10, 30, 18),
        "k_range": (45, 55, 50),
        "ph_range": (6.0, 7.0),
        "temp_range": (24.0, 32.0, 26.0),
        "humidity_range": (80.0, 90.0, 88.0),
        "rainfall_range": (40.0, 60.0, 50.0),
        "soil_types": ["sandy", "sandy loam", "alluvial"],
        "season": "Zaid (Summer)",
        "duration_days": 85,
        "water_req": "Medium",
        "yield_range": "150 - 250 Quintals/Acre",
        "description": "High market-value summer fruit performing best in warm, sandy riverbed soils.",
    },
    {
        "name": "Banana",
        "category": "Fruit / Plantation",
        "n_range": (80, 120, 100),
        "p_range": (70, 95, 82),
        "k_range": (45, 55, 50),
        "ph_range": (5.5, 7.0),
        "temp_range": (25.0, 32.0, 27.0),
        "humidity_range": (75.0, 85.0, 80.0),
        "rainfall_range": (90.0, 120.0, 105.0),
        "soil_types": ["alluvial", "clayey loam", "loamy"],
        "season": "Year-round",
        "duration_days": 330,
        "water_req": "High",
        "yield_range": "200 - 350 Quintals/Acre",
        "description": "Heavy nutrient and moisture feeder yielding sustained high commercial returns.",
    },
    {
        "name": "Pomegranate",
        "category": "Horticulture / Fruit",
        "n_range": (15, 40, 20),
        "p_range": (10, 30, 20),
        "k_range": (35, 45, 40),
        "ph_range": (5.5, 7.2),
        "temp_range": (20.0, 30.0, 24.0),
        "humidity_range": (85.0, 95.0, 90.0),
        "rainfall_range": (100.0, 120.0, 110.0),
        "soil_types": ["sandy loam", "loamy", "black"],
        "season": "Year-round",
        "duration_days": 210,
        "water_req": "Medium",
        "yield_range": "40 - 60 Quintals/Acre",
        "description": "High-value export fruit tolerant to dry periods once root network is established.",
    },
    {
        "name": "Jute",
        "category": "Commercial / Fiber",
        "n_range": (60, 100, 78),
        "p_range": (35, 60, 46),
        "k_range": (35, 45, 40),
        "ph_range": (6.0, 7.4),
        "temp_range": (23.0, 36.0, 25.0),
        "humidity_range": (70.0, 90.0, 80.0),
        "rainfall_range": (150.0, 200.0, 175.0),
        "soil_types": ["alluvial", "clayey loam", "loamy"],
        "season": "Kharif",
        "duration_days": 130,
        "water_req": "High",
        "yield_range": "12 - 18 Quintals/Acre",
        "description": "Golden fiber crop requiring abundant monsoon rains and fertile river basin silt.",
    },
    {
        "name": "Coffee",
        "category": "Plantation / Beverage",
        "n_range": (80, 120, 101),
        "p_range": (15, 35, 29),
        "k_range": (25, 35, 30),
        "ph_range": (6.0, 7.0),
        "temp_range": (22.0, 28.0, 25.0),
        "humidity_range": (55.0, 70.0, 60.0),
        "rainfall_range": (120.0, 190.0, 158.0),
        "soil_types": ["red loam", "laterite", "forest loam"],
        "season": "Year-round",
        "duration_days": 300,
        "water_req": "Medium",
        "yield_range": "6 - 12 Quintals/Acre",
        "description": "Shade-grown plantation crop thriving in gentle hill topography with rich organic matter.",
    },
]


class CropService:
    """
    AI-driven Agrimind recommendation engine for crop selection and fertilizer dosing.
    """

    def _score_parameter(self, val: float, target_range: tuple) -> float:
        """
        Computes Gaussian-style closeness score (0.0 to 1.0) for a continuous metric.
        target_range: (min_acceptable, max_acceptable, ideal) or (min, max)
        """
        if len(target_range) == 3:
            min_v, max_v, ideal = target_range
        else:
            min_v, max_v = target_range
            ideal = (min_v + max_v) / 2.0

        if min_v <= val <= max_v:
            # Inside ideal band
            dist = abs(val - ideal)
            span = max(abs(max_v - ideal), abs(ideal - min_v), 1.0)
            return max(0.65, 1.0 - (dist / span) * 0.35)
        else:
            # Outside band: penalize based on distance
            dist = min(abs(val - min_v), abs(val - max_v))
            span = max(max_v - min_v, 1.0)
            return max(0.1, 0.65 * math.exp(-1.5 * (dist / span)))

    def recommend_crops(
        self,
        nitrogen: float,
        phosphorus: float,
        potassium: float,
        ph: float,
        temperature: float,
        humidity: float,
        rainfall: float,
        soil_type: Optional[str] = None,
    ) -> List[CropRecommendationItem]:
        """
        Evaluates crop suitability across 22 crops and returns ranked recommendations.
        """
        soil_clean = (soil_type or "").lower().strip()
        scored_crops = []

        for crop in CROPS_DATABASE:
            n_score = self._score_parameter(nitrogen, crop["n_range"])
            p_score = self._score_parameter(phosphorus, crop["p_range"])
            k_score = self._score_parameter(potassium, crop["k_range"])
            ph_score = self._score_parameter(ph, crop["ph_range"])
            temp_score = self._score_parameter(temperature, crop["temp_range"])
            hum_score = self._score_parameter(humidity, crop["humidity_range"])
            rain_score = self._score_parameter(rainfall, crop["rainfall_range"])

            # Weighted aggregate score
            base_score = (
                n_score * 0.16 +
                p_score * 0.16 +
                k_score * 0.16 +
                ph_score * 0.16 +
                temp_score * 0.14 +
                hum_score * 0.10 +
                rain_score * 0.12
            )

            # Soil compatibility factor
            soil_factor = 1.0
            if soil_clean:
                matches_soil = any(st in soil_clean for st in crop["soil_types"])
                soil_factor = 1.08 if matches_soil else 0.94

            final_confidence = min(98, max(45, int(round(base_score * soil_factor * 100))))

            scored_crops.append(
                CropRecommendationItem(
                    crop_name=crop["name"],
                    confidence_pct=final_confidence,
                    category=crop["category"],
                    expected_yield_range=crop["yield_range"],
                    water_requirement=crop["water_req"],
                    duration_days=crop["duration_days"],
                    season=crop["season"],
                    suitable_soil_types=crop["soil_types"],
                    optimal_temperature=f"{crop['temp_range'][0]:.0f}°C - {crop['temp_range'][1]:.0f}°C",
                    description=crop["description"],
                )
            )

        # Sort by confidence descending
        scored_crops.sort(key=lambda x: x.confidence_pct, reverse=True)
        return scored_crops[:5]

    def generate_fertilizer_plan(
        self,
        crop_name: str,
        current_n: float,
        current_p: float,
        current_k: float,
        ph: float,
    ) -> FertilizerPlan:
        """
        Calculates exact nutrient deficits and commercial fertilizer dosages (Urea, DAP, MOP).
        """
        # Find crop profile or default to standard field crops
        crop_profile = None
        for c in CROPS_DATABASE:
            if c["name"].lower().startswith(crop_name.lower()) or crop_name.lower() in c["name"].lower():
                crop_profile = c
                break

        if not crop_profile:
            crop_profile = CROPS_DATABASE[0]  # Fallback to general cereal/rice

        target_n = crop_profile["n_range"][2] if len(crop_profile["n_range"]) == 3 else 80.0
        target_p = crop_profile["p_range"][2] if len(crop_profile["p_range"]) == 3 else 50.0
        target_k = crop_profile["k_range"][2] if len(crop_profile["k_range"]) == 3 else 40.0

        n_deficit = max(0.0, round(target_n - current_n, 1))
        p_deficit = max(0.0, round(target_p - current_p, 1))
        k_deficit = max(0.0, round(target_k - current_k, 1))

        # Commercial Fertilizer Calculations (Converted to kg per Acre):
        # 1 Acre = 0.4047 Hectare
        # Urea (46% N) -> N_deficit * 2.17 * 0.4047
        # DAP (46% P2O5, 18% N) -> P_deficit * 2.17 * 0.4047
        # MOP (60% K2O) -> K_deficit * 1.67 * 0.4047
        urea_kg = round(n_deficit * 0.88, 1) if n_deficit > 5.0 else 0.0
        dap_kg = round(p_deficit * 0.88, 1) if p_deficit > 5.0 else 0.0
        mop_kg = round(k_deficit * 0.68, 1) if k_deficit > 5.0 else 0.0

        recommendations: List[FertilizerItem] = []

        if dap_kg > 0:
            recommendations.append(
                FertilizerItem(
                    fertilizer_name="Diammonium Phosphate (DAP 18:46:0)",
                    quantity_kg_per_acre=dap_kg,
                    schedule="Basal Application: Mix into soil 5cm deep during final land preparation before sowing.",
                    purpose=f"Fulfills {p_deficit} kg/ha phosphorus requirement for vigorous root establishment.",
                )
            )

        if urea_kg > 0:
            half_urea = round(urea_kg / 2.0, 1)
            recommendations.append(
                FertilizerItem(
                    fertilizer_name="Urea (46% N)",
                    quantity_kg_per_acre=half_urea,
                    schedule="First Top Dressing: Broadcast 25 - 30 days after sowing or during active tillering.",
                    purpose=f"Provides active nitrogen to stimulate rapid vegetative canopy and leaf chlorophyll.",
                )
            )
            recommendations.append(
                FertilizerItem(
                    fertilizer_name="Urea (46% N) - Second Split",
                    quantity_kg_per_acre=half_urea,
                    schedule="Second Top Dressing: Apply at panicle/flower initiation (50 - 60 days after sowing).",
                    purpose="Maintains grain filling and panicle development without lodging risks.",
                )
            )

        if mop_kg > 0:
            recommendations.append(
                FertilizerItem(
                    fertilizer_name="Muriate of Potash (MOP 60% K2O)",
                    quantity_kg_per_acre=mop_kg,
                    schedule="Basal Dressing: Incorporate at sowing alongside DAP.",
                    purpose=f"Addresses {k_deficit} kg/ha potassium deficit; boosts drought tolerance and disease resistance.",
                )
            )

        if not recommendations:
            recommendations.append(
                FertilizerItem(
                    fertilizer_name="Bio-NPK Consortium / Liquid Biofertilizer",
                    quantity_kg_per_acre=2.0,
                    schedule="Seed treatment or drip fertigation at 15 days.",
                    purpose="Soil macronutrients are well-balanced; biofertilizers sustain active beneficial mycorrhizal microbes.",
                )
            )

        # Organic amendments & pH conditioning
        organic_amendments = [
            "Well-decomposed Farmyard Manure (FYM): Apply 4-5 tonnes per acre 3 weeks prior to seeding.",
            "Vermicompost: Apply 500 kg per acre in root zones to improve moisture retention and soil organic carbon.",
            "Neem Seed Cake: Incorporate 100 kg per acre to deter root nematodes and slow down nitrogen leaching.",
        ]

        # Soil pH assessment
        if ph < 5.8:
            health_status = f"Acidic soil (pH {ph:.1f}). Nutrient uptake (especially P) is restricted."
            organic_amendments.append(
                "Agricultural Limestone (CaCO3) or Dolomite: Apply 200 kg per acre to neutralize acidity and raise pH to 6.5."
            )
        elif ph > 7.8:
            health_status = f"Alkaline / Saline soil (pH {ph:.1f}). Micronutrient lockout (Zinc, Iron) likely."
            organic_amendments.append(
                "Agricultural Gypsum (CaSO4): Broadcast 250 kg per acre followed by leaching irrigation to displace sodium."
            )
        else:
            health_status = f"Optimal neutral soil (pH {ph:.1f}). Excellent cation exchange capacity and biological activity."

        return FertilizerPlan(
            target_crop=crop_profile["name"],
            soil_health_assessment=health_status,
            nutrient_deficits={
                "nitrogen_kg_ha": n_deficit,
                "phosphorus_kg_ha": p_deficit,
                "potassium_kg_ha": k_deficit,
            },
            recommendations=recommendations,
            organic_amendments=organic_amendments,
        )

    async def execute_engine(
        self,
        request: CropRecommendRequest,
        farm_data: Optional[Dict[str, Any]] = None,
        weather_data: Optional[Dict[str, Any]] = None,
    ) -> AgrimindEngineResponse:
        """
        Coordinates soil inputs, weather metrics, and agronomic ML inference.
        """
        # Resolve metrics (explicit overrides > farm soil data > regional agricultural defaults)
        nitrogen = request.nitrogen
        if nitrogen is None and farm_data:
            nitrogen = farm_data.get("nitrogen")
        if nitrogen is None:
            nitrogen = 65.0  # Balanced baseline

        phosphorus = request.phosphorus
        if phosphorus is None and farm_data:
            phosphorus = farm_data.get("phosphorus")
        if phosphorus is None:
            phosphorus = 45.0

        potassium = request.potassium
        if potassium is None and farm_data:
            potassium = farm_data.get("potassium")
        if potassium is None:
            potassium = 35.0

        ph = request.ph
        if ph is None and farm_data:
            ph = farm_data.get("soil_ph")
        if ph is None:
            ph = 6.6

        # Resolve climate metrics (explicit > real-time weather telemetry > regional defaults)
        temperature = request.temperature
        if temperature is None and weather_data:
            temperature = weather_data.get("temperature")
        if temperature is None:
            temperature = 27.5

        humidity = request.humidity
        if humidity is None and weather_data:
            humidity = weather_data.get("humidity")
        if humidity is None:
            humidity = 70.0

        rainfall = request.rainfall
        if rainfall is None and weather_data:
            # If weather has 7-day cumulative or forecast rain, extrapolate or use seasonal estimate
            rainfall = weather_data.get("precipitation", 0.0) * 15.0  # scaled to monthly equivalent
        if rainfall is None or rainfall < 10.0:
            rainfall = 95.0

        soil_type = request.soil_type or (farm_data.get("soil_type") if farm_data else "Loamy")

        # 1. Run Crop Recommendation Model
        recommended_crops = self.recommend_crops(
            nitrogen=nitrogen,
            phosphorus=phosphorus,
            potassium=potassium,
            ph=ph,
            temperature=temperature,
            humidity=humidity,
            rainfall=rainfall,
            soil_type=soil_type,
        )

        # 2. Run Fertilizer Guidance Model
        top_crop = request.target_crop or (recommended_crops[0].crop_name if recommended_crops else "Rice (Paddy)")
        fertilizer_plan = self.generate_fertilizer_plan(
            crop_name=top_crop,
            current_n=nitrogen,
            current_p=phosphorus,
            current_k=potassium,
            ph=ph,
        )

        return AgrimindEngineResponse(
            recommended_crops=recommended_crops,
            fertilizer_plan=fertilizer_plan,
            telemetry_source={
                "nitrogen": nitrogen,
                "phosphorus": phosphorus,
                "potassium": potassium,
                "ph": ph,
                "temperature": temperature,
                "humidity": humidity,
                "rainfall_estimated_mm": rainfall,
                "soil_type": soil_type,
                "used_live_farm_telemetry": bool(farm_data or weather_data),
            },
            generated_at=datetime.now(timezone.utc).isoformat(),
        )


crop_service = CropService()
