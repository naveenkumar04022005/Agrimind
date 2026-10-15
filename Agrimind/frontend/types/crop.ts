export interface CropRecommendationItem {
  crop_name: string;
  confidence_pct: number;
  category: string;
  expected_yield_range: string;
  water_requirement: string;
  duration_days: number;
  season: string;
  suitable_soil_types: string[];
  optimal_temperature: string;
  description: string;
}

export interface FertilizerItem {
  fertilizer_name: string;
  quantity_kg_per_acre: number;
  schedule: string;
  purpose: string;
}

export interface FertilizerPlan {
  target_crop: string;
  soil_health_assessment: string;
  nutrient_deficits: {
    nitrogen_kg_ha: number;
    phosphorus_kg_ha: number;
    potassium_kg_ha: number;
  };
  recommendations: FertilizerItem[];
  organic_amendments: string[];
}

export interface AgrimindEngineResponse {
  recommended_crops: CropRecommendationItem[];
  fertilizer_plan?: FertilizerPlan | null;
  telemetry_source: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
    temperature: number;
    humidity: number;
    rainfall_estimated_mm: number;
    soil_type?: string;
    used_live_farm_telemetry: boolean;
  };
  generated_at: string;
}
