"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api, { FarmData } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  FlaskConical,
  Clock,
  CloudSun,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  Layers,
} from "lucide-react";

export default function FertilizerPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [farm, setFarm] = useState<FarmData | null>(null);
  const [isLoadingFarm, setIsLoadingFarm] = useState(true);

  // Form State
  const [crop, setCrop] = useState("Wheat");
  const [growthStage, setGrowthStage] = useState("Vegetative");
  const [area, setArea] = useState<number>(2.5);

  // Recommendation State
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Load Farm Baseline
  useEffect(() => {
    async function loadFarm() {
      if (!user) return;
      try {
        const farmData = await api.getFarm();
        if (farmData) {
          setFarm(farmData);
          if (farmData.current_crop) setCrop(farmData.current_crop);
          if (farmData.land_area) setArea(farmData.land_area);
        }
      } catch (err) {
        console.error("Failed to load farm:", err);
      } finally {
        setIsLoadingFarm(false);
      }
    }
    loadFarm();
  }, [user]);

  // Request Recommendation
  const fetchRecommendation = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getFertilizerRecommendation({
        crop,
        growth_stage: growthStage,
        farm_area_acres: area,
        nitrogen: farm?.nitrogen,
        phosphorus: farm?.phosphorus,
        potassium: farm?.potassium,
        soil_ph: farm?.soil_ph,
        farm_id: farm?.id,
      });
      setRecommendation(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to calculate fertilizer plan.";
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [crop, growthStage, area, farm, toastError]);

  useEffect(() => {
    if (!isLoadingFarm) {
      fetchRecommendation();
    }
  }, [isLoadingFarm, fetchRecommendation]);

  if (isLoadingFarm) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Fertilizer Plan
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Nutrient management calibrated against soil chemistry and current crop growth stage.
        </p>
      </div>

      {/* Control Strip: Current Crop, Growth Stage, Area */}
      <Card className="p-5 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Current Crop"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
          >
            <option value="Wheat">Wheat</option>
            <option value="Rice">Rice (Paddy)</option>
            <option value="Maize">Maize (Corn)</option>
            <option value="Cotton">Cotton</option>
            <option value="Sugarcane">Sugarcane</option>
            <option value="Tomato">Tomato</option>
            <option value="Potato">Potato</option>
          </Select>

          <Select
            label="Growth Stage"
            value={growthStage}
            onChange={(e) => setGrowthStage(e.target.value)}
          >
            <option value="Basal">Basal (At Sowing)</option>
            <option value="Vegetative">Vegetative (Leaf & Stem)</option>
            <option value="Flowering">Flowering</option>
            <option value="Maturity">Maturity / Grain Fill</option>
          </Select>

          <Input
            label="Planted Area (Acres)"
            type="number"
            step="0.1"
            min="0.1"
            value={area}
            onChange={(e) => setArea(parseFloat(e.target.value) || 1)}
          />
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
          {/* Soil summary snippet */}
          <div className="text-xs text-neutral-500 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              Soil: {farm?.soil_type || "Loamy"} • NPK: {farm?.nitrogen || 100}:{farm?.phosphorus || 50}:{farm?.potassium || 50} kg/ha
            </span>
          </div>

          <Button
            size="sm"
            onClick={fetchRecommendation}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            Update Plan
          </Button>
        </div>
      </Card>

      {/* Main Fertilizer Recommendation */}
      {recommendation ? (
        <Card className="p-6 sm:p-7 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-primary-700">
                  Target Fertilizer
                </span>
                <Badge variant="primary" size="sm">
                  {growthStage} Stage
                </Badge>
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">
                {recommendation.fertilizer_name}
              </h2>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 block">
                Total Quantity
              </span>
              <span className="text-lg font-semibold text-neutral-900">
                {recommendation.total_quantity_needed}
              </span>
            </div>
          </div>

          {/* Dosage & Application Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Recommended Dosage
              </span>
              <p className="text-sm font-medium text-neutral-800">
                {recommendation.recommended_dosage}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Nutrient Deficiency Status
              </span>
              <p className="text-sm font-medium text-neutral-800">
                {recommendation.deficiency_detected?.primary || "Nitrogen supplement required for vegetative push"}
              </p>
            </div>
          </div>

          {/* Timing & Weather Consideration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 block">
                  Application Timing
                </span>
                <span className="text-xs text-neutral-500 leading-relaxed mt-0.5 block">
                  Apply early morning (07:00 – 09:30 AM) when leaf stomata are open and dew has evaporated.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CloudSun className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 block">
                  Weather Consideration
                </span>
                <span className="text-xs text-neutral-500 leading-relaxed mt-0.5 block">
                  Verify wind speed is under 15 km/h. Do not apply within 24 hours prior to forecasted heavy precipitation.
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Explanation: "Why this recommendation?" */}
          <div className="pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
            >
              <span>Why this recommendation?</span>
              {showExplanation ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showExplanation && (
              <div className="mt-3 p-4 rounded-lg bg-neutral-50/80 border border-neutral-200 text-xs text-neutral-600 space-y-2">
                <p className="leading-relaxed">
                  During the <strong>{growthStage}</strong> stage, {crop} prioritizes rapid vegetative cell division, demanding higher bio-available nitrogen.
                </p>
                <p className="leading-relaxed">
                  Your soil shows baseline nitrogen of {farm?.nitrogen || 100} kg/ha. The application of {recommendation.fertilizer_name} compensates for the seasonal deficit while maintaining organic microbial equilibrium.
                </p>
                {recommendation.organic_alternatives && recommendation.organic_alternatives.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200">
                    <span className="font-semibold text-neutral-800 block mb-1">
                      Organic Alternatives:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-neutral-600">
                      {recommendation.organic_alternatives.map((org: string, i: number) => (
                        <li key={i}>{org}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
