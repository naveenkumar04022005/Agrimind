"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import api, { FarmData, WeatherDataResponse } from "@/lib/api";
import { WeatherCard } from "@/components/weather/WeatherCard";
import { ForecastCard } from "@/components/weather/ForecastCard";
import { WeatherSkeleton } from "@/components/weather/WeatherSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CloudSun, RefreshCw, MapPin, AlertCircle } from "lucide-react";

export default function WeatherPage() {
  const { user } = useAuth();

  const [farm, setFarm] = useState<FarmData | null>(null);
  const [isLoadingFarm, setIsLoadingFarm] = useState(true);
  const [weather, setWeather] = useState<WeatherDataResponse | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFarm() {
      if (!user) return;
      try {
        const farmData = await api.getFarm();
        setFarm(farmData);
      } catch (err) {
        console.error("Failed to load farm:", err);
      } finally {
        setIsLoadingFarm(false);
      }
    }
    loadFarm();
  }, [user]);

  const fetchTelemetry = useCallback(async () => {
    if (!farm || (!farm.latitude && !farm.longitude)) {
      setIsLoadingWeather(false);
      return;
    }
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const data = await api.getWeather();
      setWeather(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Weather telemetry service currently unreachable.";
      setWeatherError(msg);
    } finally {
      setIsLoadingWeather(false);
    }
  }, [farm]);

  useEffect(() => {
    if (farm) {
      fetchTelemetry();
    }
  }, [farm, fetchTelemetry]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
            Microclimate Weather
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time agricultural forecast and telemetry from Open-Meteo.
          </p>
        </div>

        {farm?.latitude && (
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchTelemetry}
            isLoading={isLoadingWeather}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Weather
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoadingWeather || isLoadingFarm ? (
        <div className="space-y-6">
          <WeatherSkeleton />
          <WeatherSkeleton />
        </div>
      ) : !farm ? (
        <EmptyState
          icon={<CloudSun className="w-6 h-6" />}
          title="No Farm Configured"
          description="Create your farm profile and coordinates to activate microclimate weather telemetry."
          actionLabel="Set Up Farm"
          actionHref="/onboarding"
        />
      ) : !farm.latitude || !farm.longitude ? (
        <Card className="p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 mx-auto">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Coordinates Not Configured
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Microclimate predictions require latitude and longitude coordinates.
          </p>
          <Link href="/farm">
            <Button size="sm">Set Coordinates</Button>
          </Link>
        </Card>
      ) : weatherError ? (
        <Card className="p-6 border-red-200 bg-red-50/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div className="text-xs text-red-700">
              <p className="font-semibold">Weather unavailable</p>
              <p className="mt-0.5">{weatherError}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={fetchTelemetry}>
            Try Again
          </Button>
        </Card>
      ) : weather ? (
        <div className="space-y-6">
          {/* Weather card with 2-3 second scannable metrics + Agrimind Insight */}
          <WeatherCard weather={weather as any} />

          {/* 7-day forecast */}
          <ForecastCard forecasts={weather.daily as any} />
        </div>
      ) : null}
    </div>
  );
}
