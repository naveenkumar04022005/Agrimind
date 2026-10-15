-- ==============================================================================
-- Agrimind - Production Supabase PostgreSQL Schema
-- Location: data/schemas/schema.sql (Mirrored from supabase/schema.sql)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('farmer', 'agronomist', 'researcher', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE soil_type AS ENUM (
        'clay',
        'sandy',
        'loamy',
        'silt',
        'peaty',
        'chalky',
        'saline',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crop_cycle_status AS ENUM (
        'planned',
        'sown',
        'growing',
        'flowering',
        'harvesting',
        'completed',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE health_severity AS ENUM (
        'healthy',
        'low',
        'moderate',
        'severe',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE conversation_role AS ENUM ('user', 'assistant', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. UTILITY FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLES DEFINITION

-- ------------------------------------------------------------------------------
-- 4.1 PROFILES TABLE (Linked 1:1 with auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'farmer',
    preferred_language TEXT NOT NULL DEFAULT 'en',
    country TEXT DEFAULT 'India',
    state TEXT,
    district TEXT,
    village TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatic profile creation upon Supabase auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'farmer'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4.2 FARMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    total_area_acres NUMERIC(8, 2) NOT NULL CHECK (total_area_acres > 0),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    elevation_meters NUMERIC(7, 2),
    state TEXT,
    district TEXT,
    village TEXT,
    address TEXT,
    soil_type soil_type DEFAULT 'loamy',
    irrigation_type TEXT DEFAULT 'drip',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_farms_updated_at ON public.farms;
CREATE TRIGGER tr_farms_updated_at
    BEFORE UPDATE ON public.farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4.3 SOIL_DATA TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.soil_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sample_depth_cm NUMERIC(5, 2) DEFAULT 15.00,
    nitrogen_mg_kg NUMERIC(8, 2) NOT NULL CHECK (nitrogen_mg_kg >= 0),
    phosphorus_mg_kg NUMERIC(8, 2) NOT NULL CHECK (phosphorus_mg_kg >= 0),
    potassium_mg_kg NUMERIC(8, 2) NOT NULL CHECK (potassium_mg_kg >= 0),
    ph_level NUMERIC(4, 2) NOT NULL CHECK (ph_level >= 0.0 AND ph_level <= 14.0),
    organic_matter_pct NUMERIC(5, 2) CHECK (organic_matter_pct >= 0.0 AND organic_matter_pct <= 100.0),
    electrical_conductivity NUMERIC(6, 2),
    moisture_pct NUMERIC(5, 2) CHECK (moisture_pct >= 0.0 AND moisture_pct <= 100.0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_soil_data_updated_at ON public.soil_data;
CREATE TRIGGER tr_soil_data_updated_at
    BEFORE UPDATE ON public.soil_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4.4 CROPS REFERENCE TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    scientific_name TEXT,
    category TEXT NOT NULL DEFAULT 'cereals',
    min_temperature_celsius NUMERIC(5, 2),
    max_temperature_celsius NUMERIC(5, 2),
    min_rainfall_mm NUMERIC(8, 2),
    max_rainfall_mm NUMERIC(8, 2),
    ideal_ph_min NUMERIC(4, 2) DEFAULT 6.0,
    ideal_ph_max NUMERIC(4, 2) DEFAULT 7.5,
    growing_duration_days INT CHECK (growing_duration_days > 0),
    ideal_nitrogen_mg_kg NUMERIC(8, 2),
    ideal_phosphorus_mg_kg NUMERIC(8, 2),
    ideal_potassium_mg_kg NUMERIC(8, 2),
    is_system_standard BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4.5 CROP_CYCLES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crop_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cycle_name TEXT NOT NULL,
    area_planted_acres NUMERIC(8, 2) NOT NULL CHECK (area_planted_acres > 0),
    sowing_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    status crop_cycle_status NOT NULL DEFAULT 'sown',
    actual_yield_kg NUMERIC(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_crop_cycles_updated_at ON public.crop_cycles;
CREATE TRIGGER tr_crop_cycles_updated_at
    BEFORE UPDATE ON public.crop_cycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4.6 CROP_RECOMMENDATIONS TABLE (ML Decision Support)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crop_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    soil_data_id UUID REFERENCES public.soil_data(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommended_crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL,
    recommended_crop_name TEXT NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    alternatives JSONB DEFAULT '[]'::jsonb,
    rationale TEXT,
    expected_yield_estimate_kg_acre NUMERIC(10, 2),
    model_version TEXT DEFAULT 'v1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4.7 FERTILIZER_RECOMMENDATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fertilizer_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    soil_data_id UUID REFERENCES public.soil_data(id) ON DELETE SET NULL,
    crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fertilizer_name TEXT NOT NULL,
    recommended_dosage_kg_acre NUMERIC(8, 2) NOT NULL CHECK (recommended_dosage_kg_acre >= 0),
    application_stage TEXT NOT NULL DEFAULT 'Basal',
    instructions TEXT,
    deficiency_detected JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4.8 CROP_HEALTH_REPORTS TABLE (Vision Transformer Diagnostics)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crop_health_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    crop_id REFERENCES public.crops(id) ON DELETE SET NULL,
    crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    diagnosed_disease TEXT NOT NULL,
    severity health_severity NOT NULL DEFAULT 'low',
    confidence_score NUMERIC(5, 4) NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    symptoms TEXT[] DEFAULT '{}',
    organic_treatment TEXT,
    chemical_treatment TEXT,
    preventive_measures TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_crop_health_reports_updated_at ON public.crop_health_reports;
CREATE TRIGGER tr_crop_health_reports_updated_at
    BEFORE UPDATE ON public.crop_health_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4.9 WEATHER_DATA TABLE (Open-Meteo Telemetry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weather_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL,
    forecast_type TEXT NOT NULL DEFAULT 'current',
    temperature_celsius NUMERIC(5, 2) NOT NULL,
    humidity_percentage NUMERIC(5, 2) NOT NULL CHECK (humidity_percentage >= 0 AND humidity_percentage <= 100),
    precipitation_mm NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    precipitation_probability_pct NUMERIC(5, 2),
    wind_speed_kmh NUMERIC(6, 2),
    solar_radiation_w_m2 NUMERIC(7, 2),
    weather_code INT,
    weather_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4.10 AI_CONVERSATIONS & AI_MESSAGES TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Agronomy Consultation',
    context_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER tr_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role conversation_role NOT NULL,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_farms_geo ON public.farms(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_soil_data_farm_id ON public.soil_data(farm_id);
CREATE INDEX IF NOT EXISTS idx_soil_data_user_id ON public.soil_data(user_id);
CREATE INDEX IF NOT EXISTS idx_soil_data_test_date ON public.soil_data(farm_id, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_crops_category ON public.crops(category);
CREATE INDEX IF NOT EXISTS idx_crops_system ON public.crops(is_system_standard);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_farm_id ON public.crop_cycles(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_crop_id ON public.crop_cycles(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_user_id ON public.crop_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_status ON public.crop_cycles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crop_rec_user_farm ON public.crop_recommendations(user_id, farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_rec_created ON public.crop_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fert_rec_user_farm ON public.fertilizer_recommendations(user_id, farm_id);
CREATE INDEX IF NOT EXISTS idx_fert_rec_created ON public.fertilizer_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON public.crop_health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_farm_id ON public.crop_health_reports(farm_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_resolved ON public.crop_health_reports(user_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_health_reports_created ON public.crop_health_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_farm_recorded ON public.weather_data(farm_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_user_id ON public.weather_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_updated ON public.ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_created ON public.ai_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON public.ai_messages(user_id);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fertilizer_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 6.2 Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 6.3 Farms Policies
DROP POLICY IF EXISTS "Users can view their own farms" ON public.farms;
CREATE POLICY "Users can view their own farms"
    ON public.farms FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own farms" ON public.farms;
CREATE POLICY "Users can create their own farms"
    ON public.farms FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own farms" ON public.farms;
CREATE POLICY "Users can update their own farms"
    ON public.farms FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own farms" ON public.farms;
CREATE POLICY "Users can delete their own farms"
    ON public.farms FOR DELETE
    USING (auth.uid() = user_id);

-- 6.4 Soil Data Policies
DROP POLICY IF EXISTS "Users can view their own soil data" ON public.soil_data;
CREATE POLICY "Users can view their own soil data"
    ON public.soil_data FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert soil data for their farms" ON public.soil_data;
CREATE POLICY "Users can insert soil data for their farms"
    ON public.soil_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own soil data" ON public.soil_data;
CREATE POLICY "Users can update their own soil data"
    ON public.soil_data FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own soil data" ON public.soil_data;
CREATE POLICY "Users can delete their own soil data"
    ON public.soil_data FOR DELETE
    USING (auth.uid() = user_id);

-- 6.5 Crops Policies
DROP POLICY IF EXISTS "Users can view standard crops or their own custom crops" ON public.crops;
CREATE POLICY "Users can view standard crops or their own custom crops"
    ON public.crops FOR SELECT
    USING (is_system_standard = true OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can insert custom crops" ON public.crops;
CREATE POLICY "Users can insert custom crops"
    ON public.crops FOR INSERT
    WITH CHECK (auth.uid() = created_by AND is_system_standard = false);

DROP POLICY IF EXISTS "Users can update their own custom crops" ON public.crops;
CREATE POLICY "Users can update their own custom crops"
    ON public.crops FOR UPDATE
    USING (auth.uid() = created_by AND is_system_standard = false)
    WITH CHECK (auth.uid() = created_by AND is_system_standard = false);

DROP POLICY IF EXISTS "Users can delete their own custom crops" ON public.crops;
CREATE POLICY "Users can delete their own custom crops"
    ON public.crops FOR DELETE
    USING (auth.uid() = created_by AND is_system_standard = false);

-- 6.6 Crop Cycles Policies
DROP POLICY IF EXISTS "Users can view their own crop cycles" ON public.crop_cycles;
CREATE POLICY "Users can view their own crop cycles"
    ON public.crop_cycles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own crop cycles" ON public.crop_cycles;
CREATE POLICY "Users can insert their own crop cycles"
    ON public.crop_cycles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own crop cycles" ON public.crop_cycles;
CREATE POLICY "Users can update their own crop cycles"
    ON public.crop_cycles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own crop cycles" ON public.crop_cycles;
CREATE POLICY "Users can delete their own crop cycles"
    ON public.crop_cycles FOR DELETE
    USING (auth.uid() = user_id);

-- 6.7 Crop Recommendations Policies
DROP POLICY IF EXISTS "Users can view their own crop recommendations" ON public.crop_recommendations;
CREATE POLICY "Users can view their own crop recommendations"
    ON public.crop_recommendations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own crop recommendations" ON public.crop_recommendations;
CREATE POLICY "Users can insert their own crop recommendations"
    ON public.crop_recommendations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own crop recommendations" ON public.crop_recommendations;
CREATE POLICY "Users can delete their own crop recommendations"
    ON public.crop_recommendations FOR DELETE
    USING (auth.uid() = user_id);

-- 6.8 Fertilizer Recommendations Policies
DROP POLICY IF EXISTS "Users can view their own fertilizer recommendations" ON public.fertilizer_recommendations;
CREATE POLICY "Users can view their own fertilizer recommendations"
    ON public.fertilizer_recommendations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own fertilizer recommendations" ON public.fertilizer_recommendations;
CREATE POLICY "Users can insert their own fertilizer recommendations"
    ON public.fertilizer_recommendations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own fertilizer recommendations" ON public.fertilizer_recommendations;
CREATE POLICY "Users can delete their own fertilizer recommendations"
    ON public.fertilizer_recommendations FOR DELETE
    USING (auth.uid() = user_id);

-- 6.9 Crop Health Reports Policies
DROP POLICY IF EXISTS "Users can view their own crop health reports" ON public.crop_health_reports;
CREATE POLICY "Users can view their own crop health reports"
    ON public.crop_health_reports FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own crop health reports" ON public.crop_health_reports;
CREATE POLICY "Users can insert their own crop health reports"
    ON public.crop_health_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own crop health reports" ON public.crop_health_reports;
CREATE POLICY "Users can update their own crop health reports"
    ON public.crop_health_reports FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own crop health reports" ON public.crop_health_reports;
CREATE POLICY "Users can delete their own crop health reports"
    ON public.crop_health_reports FOR DELETE
    USING (auth.uid() = user_id);

-- 6.10 Weather Data Policies
DROP POLICY IF EXISTS "Users can view their farm weather data" ON public.weather_data;
CREATE POLICY "Users can view their farm weather data"
    ON public.weather_data FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert weather data for their farms" ON public.weather_data;
CREATE POLICY "Users can insert weather data for their farms"
    ON public.weather_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their weather data" ON public.weather_data;
CREATE POLICY "Users can delete their weather data"
    ON public.weather_data FOR DELETE
    USING (auth.uid() = user_id);

-- 6.11 AI Conversations & Messages Policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can view their own conversations"
    ON public.ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can insert their own conversations"
    ON public.ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can update their own conversations"
    ON public.ai_conversations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can delete their own conversations"
    ON public.ai_conversations FOR DELETE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own messages" ON public.ai_messages;
CREATE POLICY "Users can view their own messages"
    ON public.ai_messages FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own messages" ON public.ai_messages;
CREATE POLICY "Users can insert their own messages"
    ON public.ai_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.ai_messages;
CREATE POLICY "Users can delete their own messages"
    ON public.ai_messages FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 7. SEED DATA - STANDARD CROPS
-- ==============================================================================
INSERT INTO public.crops (
    name,
    scientific_name,
    category,
    min_temperature_celsius,
    max_temperature_celsius,
    min_rainfall_mm,
    max_rainfall_mm,
    ideal_ph_min,
    ideal_ph_max,
    growing_duration_days,
    ideal_nitrogen_mg_kg,
    ideal_phosphorus_mg_kg,
    ideal_potassium_mg_kg,
    is_system_standard
) VALUES
('Rice (Paddy)', 'Oryza sativa', 'cereals', 20.0, 37.0, 1000.0, 2500.0, 5.5, 7.0, 120, 100.0, 40.0, 40.0, true),
('Wheat', 'Triticum aestivum', 'cereals', 10.0, 25.0, 400.0, 900.0, 6.0, 7.5, 140, 120.0, 60.0, 40.0, true),
('Maize (Corn)', 'Zea mays', 'cereals', 18.0, 32.0, 500.0, 1000.0, 5.8, 7.2, 110, 120.0, 60.0, 50.0, true),
('Cotton', 'Gossypium hirsutum', 'fiber', 21.0, 35.0, 500.0, 1100.0, 5.8, 8.0, 180, 100.0, 50.0, 50.0, true),
('Sugarcane', 'Saccharum officinarum', 'cash_crop', 20.0, 35.0, 1100.0, 2200.0, 6.0, 7.5, 360, 250.0, 100.0, 120.0, true),
('Tomato', 'Solanum lycopersicum', 'vegetables', 18.0, 30.0, 400.0, 700.0, 6.0, 6.8, 90, 100.0, 60.0, 80.0, true),
('Potato', 'Solanum tuberosum', 'vegetables', 15.0, 24.0, 500.0, 800.0, 5.0, 6.5, 100, 150.0, 80.0, 100.0, true),
('Groundnut (Peanut)', 'Arachis hypogaea', 'oilseeds', 22.0, 30.0, 500.0, 1000.0, 5.5, 6.5, 120, 20.0, 40.0, 50.0, true),
('Soybean', 'Glycine max', 'pulses', 20.0, 30.0, 600.0, 1000.0, 6.0, 7.0, 110, 30.0, 60.0, 40.0, true),
('Coffee (Arabica)', 'Coffea arabica', 'plantation', 15.0, 24.0, 1200.0, 2000.0, 5.5, 6.5, 270, 140.0, 40.0, 140.0, true)
ON CONFLICT DO NOTHING;
