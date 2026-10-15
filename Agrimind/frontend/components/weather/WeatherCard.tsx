"use client";

import React from "react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  CloudSnow,
  Droplets,
  Wind,
  Thermometer,
  Compass,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface WeatherCardProps {
  weather: {
    location?: {
      latitude: number;
      longitude: number;
      farm_name?: string;
    };
    current: {
      temperature: number;
      humidity: number;
      precipitation: number;
      wind_speed: number;
      weather_code: number;
      condition: string;
      apparent_temperature?: number;
    };
    daily?: Array<{
      date: string;
      precipitation_probability?: number;
      rain_probability?: number;
      condition?: string;
    }>;
  };
}

export function getWeatherConditionIcon(code: number, className = "w-5 h-5") {
  if (code === 0) return <Sun className={`${className} text-amber-500`} />;
  if (code === 1 || code === 2) return <CloudSun className={`${className} text-amber-500`} />;
  if (code === 3) return <Cloud className={`${className} text-neutral-500`} />;
  if (code === 45 || code === 48) return <CloudFog className={`${className} text-neutral-400`} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain className={`${className} text-blue-500`} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={`${className} text-blue-300`} />;
  if (code >= 95) return <CloudLightning className={`${className} text-amber-600`} />;
  return <CloudSun className={`${className} text-amber-500`} />;
}

export function WeatherCard({ weather }: WeatherCardProps) {
  const { current, location, daily } = weather;

  // Determine Agrimind Insight based on agronomic thresholds
  let insight: {
    title: string;
    detail: string;
    variant: "neutral" | "warning" | "info" | "primary";
  } = {
    title: "Normal Field Conditions",
    detail: "Atmospheric humidity and wind are within safe ranges for routine fieldwork.",
    variant: "neutral",
  };

  const dailyTomorrow = daily?.[1] as any;
  const tomorrowRainProb = dailyTomorrow?.precipitation_probability ?? dailyTomorrow?.rain_probability ?? 0;

  if (tomorrowRainProb >= 60 || current.precipitation > 2.0) {
    insight = {
      title: "Rain Expected — Review Irrigation",
      detail: `High probability of precipitation (${tomorrowRainProb}%). Delay scheduled irrigation and nutrient spraying to prevent runoff.`,
      variant: "warning" as const,
    };
  } else if (current.wind_speed > 20) {
    insight = {
      title: "Elevated Wind Advisory",
      detail: `Current wind speed is ${Math.round(current.wind_speed)} km/h. Avoid foliar spraying to prevent spray drift.`,
      variant: "warning" as const,
    };
  } else if (current.humidity > 85) {
    insight = {
      title: "High Moisture Environment",
      detail: `Relative humidity is ${current.humidity}%. Elevated risk of fungal spore germination; monitor vulnerable leaves.`,
      variant: "info" as const,
    };
  }

  return (
    <div className="space-y-4">
      {/* 1. WEATHER METRICS SECTION */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                Weather
              </span>
              {location?.farm_name && (
                <span className="text-xs text-neutral-400">• {location.farm_name}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
                {Math.round(current.temperature)}°C
              </span>
              <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
                {getWeatherConditionIcon(current.weather_code, "w-6 h-6")}
                <span className="text-sm font-medium text-neutral-700 capitalize">
                  {current.condition || "Clear"}
                </span>
              </div>
            </div>
          </div>

          {current.apparent_temperature !== undefined && (
            <div className="text-xs text-neutral-500 sm:text-right">
              Feels like <span className="font-medium text-neutral-700">{Math.round(current.apparent_temperature)}°C</span>
            </div>
          )}
        </div>

        {/* 4 Core metrics readable in 2-3 seconds */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-neutral-400" />
              Humidity
            </span>
            <p className="text-base font-semibold text-neutral-900">
              {current.humidity}%
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-neutral-400" />
              Rainfall
            </span>
            <p className="text-base font-semibold text-neutral-900">
              {current.precipitation || 0} mm
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-neutral-400" />
              Wind
            </span>
            <p className="text-base font-semibold text-neutral-900">
              {Math.round(current.wind_speed)} km/h
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-neutral-400" />
              Next Rain
            </span>
            <p className="text-base font-semibold text-neutral-900">
              {tomorrowRainProb}%
            </p>
          </div>
        </div>
      </Card>

      {/* 2. AGRIMIND INSIGHT SECTION - Clearly Separated */}
      <div className="rounded-xl border border-primary-200/80 bg-primary-50/50 p-4 sm:p-5 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-lg bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-800">
              Agrimind Insight
            </span>
            <Badge variant="primary" size="sm">Field Advisory</Badge>
          </div>
          <p className="text-sm font-medium text-neutral-900 pt-0.5">
            {insight.title}
          </p>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {insight.detail}
          </p>
        </div>
      </div>
    </div>
  );
}
