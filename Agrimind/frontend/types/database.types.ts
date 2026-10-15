export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "farmer" | "agronomist" | "researcher" | "admin";

export type SoilType =
  | "clay"
  | "sandy"
  | "loamy"
  | "silt"
  | "peaty"
  | "chalky"
  | "saline"
  | "other";

export type CropCycleStatus =
  | "planned"
  | "sown"
  | "growing"
  | "flowering"
  | "harvesting"
  | "completed"
  | "failed";

export type HealthSeverity =
  | "healthy"
  | "low"
  | "moderate"
  | "severe"
  | "critical";

export type ConversationRole = "user" | "assistant" | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone_number: string | null;
          avatar_url: string | null;
          role: UserRole;
          preferred_language: string;
          country: string | null;
          state: string | null;
          district: string | null;
          village: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone_number?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          preferred_language?: string;
          country?: string | null;
          state?: string | null;
          district?: string | null;
          village?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone_number?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          preferred_language?: string;
          country?: string | null;
          state?: string | null;
          district?: string | null;
          village?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      farms: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          total_area_acres: number;
          latitude: number | null;
          longitude: number | null;
          elevation_meters: number | null;
          state: string | null;
          district: string | null;
          village: string | null;
          address: string | null;
          soil_type: SoilType | null;
          irrigation_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          total_area_acres: number;
          latitude?: number | null;
          longitude?: number | null;
          elevation_meters?: number | null;
          state?: string | null;
          district?: string | null;
          village?: string | null;
          address?: string | null;
          soil_type?: SoilType | null;
          irrigation_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          total_area_acres?: number;
          latitude?: number | null;
          longitude?: number | null;
          elevation_meters?: number | null;
          state?: string | null;
          district?: string | null;
          village?: string | null;
          address?: string | null;
          soil_type?: SoilType | null;
          irrigation_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      soil_data: {
        Row: {
          id: string;
          farm_id: string;
          user_id: string;
          test_date: string;
          sample_depth_cm: number | null;
          nitrogen_mg_kg: number;
          phosphorus_mg_kg: number;
          potassium_mg_kg: number;
          ph_level: number;
          organic_matter_pct: number | null;
          electrical_conductivity: number | null;
          moisture_pct: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          farm_id: string;
          user_id: string;
          test_date?: string;
          sample_depth_cm?: number | null;
          nitrogen_mg_kg: number;
          phosphorus_mg_kg: number;
          potassium_mg_kg: number;
          ph_level: number;
          organic_matter_pct?: number | null;
          electrical_conductivity?: number | null;
          moisture_pct?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          farm_id?: string;
          user_id?: string;
          test_date?: string;
          sample_depth_cm?: number | null;
          nitrogen_mg_kg?: number;
          phosphorus_mg_kg?: number;
          potassium_mg_kg?: number;
          ph_level?: number;
          organic_matter_pct?: number | null;
          electrical_conductivity?: number | null;
          moisture_pct?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crops: {
        Row: {
          id: string;
          name: string;
          scientific_name: string | null;
          category: string;
          min_temperature_celsius: number | null;
          max_temperature_celsius: number | null;
          min_rainfall_mm: number | null;
          max_rainfall_mm: number | null;
          ideal_ph_min: number | null;
          ideal_ph_max: number | null;
          growing_duration_days: number | null;
          ideal_nitrogen_mg_kg: number | null;
          ideal_phosphorus_mg_kg: number | null;
          ideal_potassium_mg_kg: number | null;
          is_system_standard: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          scientific_name?: string | null;
          category?: string;
          min_temperature_celsius?: number | null;
          max_temperature_celsius?: number | null;
          min_rainfall_mm?: number | null;
          max_rainfall_mm?: number | null;
          ideal_ph_min?: number | null;
          ideal_ph_max?: number | null;
          growing_duration_days?: number | null;
          ideal_nitrogen_mg_kg?: number | null;
          ideal_phosphorus_mg_kg?: number | null;
          ideal_potassium_mg_kg?: number | null;
          is_system_standard?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          scientific_name?: string | null;
          category?: string;
          min_temperature_celsius?: number | null;
          max_temperature_celsius?: number | null;
          min_rainfall_mm?: number | null;
          max_rainfall_mm?: number | null;
          ideal_ph_min?: number | null;
          ideal_ph_max?: number | null;
          growing_duration_days?: number | null;
          ideal_nitrogen_mg_kg?: number | null;
          ideal_phosphorus_mg_kg?: number | null;
          ideal_potassium_mg_kg?: number | null;
          is_system_standard?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      crop_cycles: {
        Row: {
          id: string;
          farm_id: string;
          crop_id: string;
          user_id: string;
          cycle_name: string;
          area_planted_acres: number;
          sowing_date: string;
          expected_harvest_date: string | null;
          actual_harvest_date: string | null;
          status: CropCycleStatus;
          actual_yield_kg: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          farm_id: string;
          crop_id: string;
          user_id: string;
          cycle_name: string;
          area_planted_acres: number;
          sowing_date: string;
          expected_harvest_date?: string | null;
          actual_harvest_date?: string | null;
          status?: CropCycleStatus;
          actual_yield_kg?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          farm_id?: string;
          crop_id?: string;
          user_id?: string;
          cycle_name?: string;
          area_planted_acres?: number;
          sowing_date?: string;
          expected_harvest_date?: string | null;
          actual_harvest_date?: string | null;
          status?: CropCycleStatus;
          actual_yield_kg?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crop_recommendations: {
        Row: {
          id: string;
          farm_id: string;
          soil_data_id: string | null;
          user_id: string;
          recommended_crop_id: string | null;
          recommended_crop_name: string;
          confidence_score: number;
          alternatives: Json;
          rationale: string | null;
          expected_yield_estimate_kg_acre: number | null;
          model_version: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          farm_id: string;
          soil_data_id?: string | null;
          user_id: string;
          recommended_crop_id?: string | null;
          recommended_crop_name: string;
          confidence_score: number;
          alternatives?: Json;
          rationale?: string | null;
          expected_yield_estimate_kg_acre?: number | null;
          model_version?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          farm_id?: string;
          soil_data_id?: string | null;
          user_id?: string;
          recommended_crop_id?: string | null;
          recommended_crop_name?: string;
          confidence_score?: number;
          alternatives?: Json;
          rationale?: string | null;
          expected_yield_estimate_kg_acre?: number | null;
          model_version?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      fertilizer_recommendations: {
        Row: {
          id: string;
          farm_id: string;
          soil_data_id: string | null;
          crop_cycle_id: string | null;
          user_id: string;
          fertilizer_name: string;
          recommended_dosage_kg_acre: number;
          application_stage: string;
          instructions: string | null;
          deficiency_detected: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          farm_id: string;
          soil_data_id?: string | null;
          crop_cycle_id?: string | null;
          user_id: string;
          fertilizer_name: string;
          recommended_dosage_kg_acre: number;
          application_stage?: string;
          instructions?: string | null;
          deficiency_detected?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          farm_id?: string;
          soil_data_id?: string | null;
          crop_cycle_id?: string | null;
          user_id?: string;
          fertilizer_name?: string;
          recommended_dosage_kg_acre?: number;
          application_stage?: string;
          instructions?: string | null;
          deficiency_detected?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      crop_health_reports: {
        Row: {
          id: string;
          farm_id: string | null;
          crop_id: string | null;
          crop_cycle_id: string | null;
          user_id: string;
          image_url: string;
          diagnosed_disease: string;
          severity: HealthSeverity;
          confidence_score: number;
          symptoms: string[];
          organic_treatment: string | null;
          chemical_treatment: string | null;
          preventive_measures: string | null;
          is_resolved: boolean;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          farm_id?: string | null;
          crop_id?: string | null;
          crop_cycle_id?: string | null;
          user_id: string;
          image_url: string;
          diagnosed_disease: string;
          severity?: HealthSeverity;
          confidence_score: number;
          symptoms?: string[];
          organic_treatment?: string | null;
          chemical_treatment?: string | null;
          preventive_measures?: string | null;
          is_resolved?: boolean;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          farm_id?: string | null;
          crop_id?: string | null;
          crop_cycle_id?: string | null;
          user_id?: string;
          image_url?: string;
          diagnosed_disease?: string;
          severity?: HealthSeverity;
          confidence_score?: number;
          symptoms?: string[];
          organic_treatment?: string | null;
          chemical_treatment?: string | null;
          preventive_measures?: string | null;
          is_resolved?: boolean;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weather_data: {
        Row: {
          id: string;
          farm_id: string;
          user_id: string;
          recorded_at: string;
          forecast_type: string;
          temperature_celsius: number;
          humidity_percentage: number;
          precipitation_mm: number;
          precipitation_probability_pct: number | null;
          wind_speed_kmh: number | null;
          solar_radiation_w_m2: number | null;
          weather_code: number | null;
          weather_description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          farm_id: string;
          user_id: string;
          recorded_at: string;
          forecast_type?: string;
          temperature_celsius: number;
          humidity_percentage: number;
          precipitation_mm?: number;
          precipitation_probability_pct?: number | null;
          wind_speed_kmh?: number | null;
          solar_radiation_w_m2?: number | null;
          weather_code?: number | null;
          weather_description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          farm_id?: string;
          user_id?: string;
          recorded_at?: string;
          forecast_type?: string;
          temperature_celsius?: number;
          humidity_percentage?: number;
          precipitation_mm?: number;
          precipitation_probability_pct?: number | null;
          wind_speed_kmh?: number | null;
          solar_radiation_w_m2?: number | null;
          weather_code?: number | null;
          weather_description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          farm_id: string | null;
          title: string;
          context_metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          farm_id?: string | null;
          title?: string;
          context_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          farm_id?: string | null;
          title?: string;
          context_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: ConversationRole;
          content: string;
          attachments: Json;
          tokens_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: ConversationRole;
          content: string;
          attachments?: Json;
          tokens_used?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: ConversationRole;
          content?: string;
          attachments?: Json;
          tokens_used?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      soil_type: SoilType;
      crop_cycle_status: CropCycleStatus;
      health_severity: HealthSeverity;
      conversation_role: ConversationRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
