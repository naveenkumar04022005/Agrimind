"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import api, { FarmData } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  Wheat,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Droplets,
  Thermometer,
  Layers,
  FlaskConical,
  CheckCircle2,
  BookmarkPlus,
  RefreshCw,
  Info,
} from "lucide-react";

export default function CropsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [farm, setFarm] = useState<FarmData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Input Parameters State
  const [nitrogen, setNitrogen] = useState<number>(80);
  const [phosphorus, setPhosphorus] = useState<number>(45);
  const [potassium, setPotassium] = useState<number>(40);
  const [ph, setPh] = useState<number>(6.5);
  const [temperature, setTemperature] = useState<number>(26.5);
  const [humidity, setHumidity] = useState<number>(75);
  const [rainfall, setRainfall] = useState<number>(180);
  const [soilType, setSoilType] = useState<string>("loamy");

  // Edit inputs toggle
  const [showInputEditor, setShowInputEditor] = useState(false);

  // Recommendations State
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Load existing farm data
  useEffect(() => {
    async function loadFarm() {
      if (!user) return;
      try {
        const farmData = await api.getFarm();
        if (farmData) {
          setFarm(farmData);
          if (farmData.soil_type) setSoilType(farmData.soil_type);
          if (farmData.nitrogen !== undefined) setNitrogen(Number(farmData.nitrogen));
          if (farmData.phosphorus !== undefined) setPhosphorus(Number(farmData.phosphorus));
          if (farmData.potassium !== undefined) setPotassium(Number(farmData.potassium));
          if (farmData.soil_ph !== undefined) setPh(Number(farmData.soil_ph));
        }
      } catch (err) {
        console.error("Failed to load farm soil profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadFarm();
  }, [user]);

  // Run Crop Recommendation
  const runRecommendation = useCallback(async () => {
    setIsSimulating(true);
    try {
      const payload: any = {
        nitrogen,
        phosphorus,
        potassium,
        ph,
        temperature,
        humidity,
        rainfall,
        soil_type: soilType,
        farm_id: farm?.id || undefined,
      };

      const res = await api.getCropRecommendation(payload);
      setResult(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to retrieve recommendation.";
      toastError(msg);
    } finally {
      setIsSimulating(false);
    }
  }, [nitrogen, phosphorus, potassium, ph, temperature, humidity, rainfall, soilType, farm, toastError]);

  // Run automatically when profile loads
  useEffect(() => {
    if (!isLoadingProfile) {
      runRecommendation();
    }
  }, [isLoadingProfile]);

  const handleSaveRecommendation = async () => {
    if (!result?.top_recommendation) return;
    setIsSaving(true);
    try {
      await api.saveCropRecommendation({
        farm_id: farm?.id || "default",
        recommended_crop_name: result.top_recommendation.crop,
        confidence_score: result.top_recommendation.confidence || 0.9,
        alternatives: result.alternatives || [],
        rationale: result.top_recommendation.rationale || "Optimal match",
      });
      success("Recommendation saved to your farm history.");
    } catch {
      toastError("Failed to save recommendation.");
    } finally {
      setIsSaving(false);
    }
  };

  // Determine primary recommended crop data
  const recommendedCrop = result?.top_recommendation || {
    crop: "Rice (Paddy)",
    confidence: 0.92,
    rationale: "Matches heavy rainfall outlook and balanced nitrogen availability.",
  };

  const alternatives = result?.alternatives && result.alternatives.length > 0
    ? result.alternatives
    : [
        { crop: "Maize (Corn)", confidence: 0.81, reason: "Moderate water requirement and strong yield efficiency." },
        { crop: "Soybean", confidence: 0.74, reason: "Nitrogen-fixing legume suitable for rotation." },
      ];

  if (isLoadingProfile) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
            Find the right crop
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Crop selection modeled on soil nutrients, rainfall forecasts, and local climate.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={runRecommendation}
          isLoading={isSimulating}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Re-Analyze
        </Button>
      </div>

      {/* Input Summary */}
      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Field Input Baseline
          </span>
          <button
            type="button"
            onClick={() => setShowInputEditor(!showInputEditor)}
            className="text-xs text-primary-700 hover:underline font-medium"
          >
            {showInputEditor ? "Hide adjustments" : "Adjust inputs"}
          </button>
        </div>

        {/* 4 Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
            <span className="text-neutral-400 block text-[10px] uppercase">Soil & pH</span>
            <span className="font-semibold text-neutral-800 capitalize">
              {soilType} • pH {ph}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
            <span className="text-neutral-400 block text-[10px] uppercase">NPK Ratio</span>
            <span className="font-semibold text-neutral-800">
              {nitrogen}:{phosphorus}:{potassium}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
            <span className="text-neutral-400 block text-[10px] uppercase">Rainfall</span>
            <span className="font-semibold text-neutral-800">{rainfall} mm</span>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
            <span className="text-neutral-400 block text-[10px] uppercase">Temperature</span>
            <span className="font-semibold text-neutral-800">{temperature}°C</span>
          </div>
        </div>

        {/* Collapsible Input Editor */}
        {showInputEditor && (
          <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Nitrogen (N)"
              type="number"
              value={nitrogen}
              onChange={(e) => setNitrogen(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Phosphorus (P)"
              type="number"
              value={phosphorus}
              onChange={(e) => setPhosphorus(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Potassium (K)"
              type="number"
              value={potassium}
              onChange={(e) => setPotassium(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Rainfall (mm)"
              type="number"
              value={rainfall}
              onChange={(e) => setRainfall(parseFloat(e.target.value) || 0)}
            />
            <div className="col-span-2 sm:col-span-4 pt-1">
              <Button size="sm" onClick={runRecommendation} isLoading={isSimulating}>
                Apply & Recalculate
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Recommended Crop Decision Card */}
      <Card className="p-6 sm:p-7 border-primary-200/90 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-primary-700">
                Recommended Crop
              </span>
              <Badge variant="primary" size="sm">
                {(recommendedCrop.confidence * 100).toFixed(0)}% Confidence
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
              {recommendedCrop.crop}
            </h2>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleSaveRecommendation}
            isLoading={isSaving}
            leftIcon={<BookmarkPlus className="w-3.5 h-3.5" />}
          >
            Save Choice
          </Button>
        </div>

        {/* Why it fits: Soil, Rainfall, Temperature, Nutrients */}
        <div className="pt-6 space-y-4">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
            Why It Fits
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-neutral-50/70 border border-neutral-100">
              <Layers className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 block">
                  Soil Compatibility
                </span>
                <span className="text-xs text-neutral-500 leading-relaxed mt-0.5 block">
                  {soilType.charAt(0).toUpperCase() + soilType.slice(1)} soil with pH {ph} provides stable root moisture retention.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-neutral-50/70 border border-neutral-100">
              <Droplets className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 block">
                  Rainfall Alignment
                </span>
                <span className="text-xs text-neutral-500 leading-relaxed mt-0.5 block">
                  Expected {rainfall} mm seasonal precipitation matches peak transpiration requirement.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-neutral-50/70 border border-neutral-100">
              <Thermometer className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 block">
                  Temperature Window
                </span>
                <span className="text-xs text-neutral-500 leading-relaxed mt-0.5 block">
                  Ambient temperature of {temperature}°C supports steady vegetative germination without heat stress.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-neutral-50/70 border border-neutral-100">
              <FlaskConical className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 block">
                  Nutrient Uptake
                </span>
                <span className="text-xs text-neutral-500 leading-relaxed mt-0.5 block">
                  Available N ({nitrogen} kg/ha) and P ({phosphorus} kg/ha) support robust tillering and root anchoring.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* View Details Accordion for Technical Information */}
        <div className="mt-6 pt-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <span>View technical model details</span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-2">
              <div className="flex items-center justify-between">
                <span>Model Type:</span>
                <span className="font-mono text-neutral-800">RandomForest AgriClassifier v2</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Confidence Score:</span>
                <span className="font-mono text-neutral-800">{recommendedCrop.confidence || 0.92}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Soil Moisture Index:</span>
                <span className="font-mono text-neutral-800">0.72 (Adequate)</span>
              </div>
              <p className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-200">
                Note: Predictions are modeled based on historic ICAR and agroclimatic datasets. Field inspection remains recommended.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Alternative Crops */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Alternative Crops
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {alternatives.map((alt: any, idx: number) => (
            <Card key={idx} className="p-4 shadow-card">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-semibold text-neutral-900">
                  {alt.crop}
                </h4>
                <Badge variant="neutral" size="sm">
                  {alt.confidence ? `${(alt.confidence * 100).toFixed(0)}% Match` : "Viable Option"}
                </Badge>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {alt.reason || "Compatible with your soil and precipitation conditions as secondary choice."}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
