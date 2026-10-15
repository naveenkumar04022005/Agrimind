"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import api, { FarmData, WeatherDataResponse } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { WeatherCard } from "@/components/weather/WeatherCard";
import { ForecastCard } from "@/components/weather/ForecastCard";
import { WeatherSkeleton } from "@/components/weather/WeatherSkeleton";
import {
  Sparkles,
  MapPin,
  ArrowRight,
  Sprout,
  CheckCircle2,
  Calendar,
  CloudSun,
  HeartPulse,
  FlaskConical,
  Bot,
  AlertTriangle,
  Clock,
  CheckSquare,
  Square,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const [farm, setFarm] = useState<FarmData | null>(null);
  const [isLoadingFarm, setIsLoadingFarm] = useState(true);

  // Weather state
  const [weather, setWeather] = useState<WeatherDataResponse | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Crop Lifecycle state
  const [cycle, setCycle] = useState<any | null>(null);
  const [isLoadingCycle, setIsLoadingCycle] = useState(true);

  // Crop Health Recent Report
  const [recentHealth, setRecentHealth] = useState<any | null>(null);

  // Daily Farm Plan Checklist State
  const [tasks, setTasks] = useState([
    { id: 1, text: "Check soil moisture before afternoon heat", done: false },
    { id: 2, text: "Inspect crop foliage for early leaf spot", done: false },
    { id: 3, text: "Review irrigation timing against tomorrow's rain forecast", done: true },
    { id: 4, text: "Monitor field perimeter drainage", done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  // Determine greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const farmerName = user?.name || user?.email?.split("@")[0] || "Farmer";

  // Load Farm Summary
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const farmData = await api.getFarm();
        setFarm(farmData);
      } catch (err) {
        console.error("Error loading farm summary:", err);
      } finally {
        setIsLoadingFarm(false);
      }
    }
    loadData();
  }, [user]);

  // Load Crop Lifecycle & Health
  useEffect(() => {
    async function loadCycleAndHealth() {
      if (!user) return;
      try {
        const [activeCycle, healthReports] = await Promise.allSettled([
          api.getCropCycle(),
          api.getCropHealthReports(),
        ]);
        if (activeCycle.status === "fulfilled") {
          setCycle(activeCycle.value);
        }
        if (
          healthReports.status === "fulfilled" &&
          Array.isArray(healthReports.value) &&
          healthReports.value.length > 0
        ) {
          setRecentHealth(healthReports.value[0]);
        }
      } catch {
        // Handled silently
      } finally {
        setIsLoadingCycle(false);
      }
    }
    loadCycleAndHealth();
  }, [user]);

  // Fetch Weather
  const fetchWeather = useCallback(async () => {
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
        err instanceof Error ? err.message : "Weather service is currently unavailable.";
      setWeatherError(msg);
    } finally {
      setIsLoadingWeather(false);
    }
  }, [farm]);

  useEffect(() => {
    if (farm) {
      fetchWeather();
    }
  }, [farm, fetchWeather]);

  // Generate Today's Advisory based on actual telemetry
  const getTodayAdvisory = () => {
    if (!farm) {
      return {
        title: "Complete your farm profile",
        reason: "Agrimind needs your location and soil specs to generate targeted daily advisories.",
        action: "Set up farm details to activate daily intelligence.",
        actionHref: "/onboarding",
        actionLabel: "Set Up Farm",
      };
    }

    const dailyTomorrow = weather?.daily?.[1] as any;
    const rainProb = dailyTomorrow?.precipitation_probability ?? dailyTomorrow?.rain_probability ?? 0;

    if (rainProb >= 60) {
      return {
        title: "Postpone Irrigation Scheduled for Today",
        reason: `High probability of rainfall (${rainProb}%) forecast for tomorrow. Irrigating today risks waterlogging root zones and nutrient leaching.`,
        action: "Hold irrigation pumps and inspect field drainage channels.",
        actionHref: "/weather",
        actionLabel: "View Weather Forecast",
      };
    }

    if (weather && weather.current && weather.current.wind_speed > 22) {
      return {
        title: "Avoid Foliar Spraying & Chemical Application",
        reason: `Current surface wind speed is ${Math.round(weather.current.wind_speed)} km/h. Wind drift reduces spray efficacy and risks neighboring plots.`,
        action: "Reschedule foliar feeding or pesticide application to calm morning hours.",
        actionHref: "/fertilizer",
        actionLabel: "Review Fertilizer Plan",
      };
    }

    return {
      title: "Field Conditions Optimal for Routine Cultivation",
      reason: `Moderate temperature (${Math.round(weather?.current?.temperature || 26)}°C) and balanced moisture support steady vegetative progress.`,
      action: "Conduct standard foliage scouting and check soil surface dryness.",
      actionHref: "/crops",
      actionLabel: "Review Crop Status",
    };
  };

  const advisory = getTodayAdvisory();

  // Lifecycle stages array for timeline
  const lifecycleStages = [
    { key: "sown", label: "Planting" },
    { key: "vegetative", label: "Vegetative" },
    { key: "flowering", label: "Flowering" },
    { key: "fruiting", label: "Fruiting" },
    { key: "harvest", label: "Harvest" },
  ];

  const currentStageKey = (cycle?.current_stage || "vegetative").toLowerCase();
  const currentStageIndex = lifecycleStages.findIndex((s) => s.key === currentStageKey) >= 0
    ? lifecycleStages.findIndex((s) => s.key === currentStageKey)
    : 1;

  return (
    <div className="space-y-8">
      {/* 1. TOP HEADER: Good morning, Farmer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/70">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {greeting}, {farmerName}
          </h1>
          <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              {farm ? farm.farm_name : "No farm configured"}
              {farm && [farm.village, farm.district, farm.state].filter(Boolean).length > 0
                ? ` • ${[farm.village, farm.district, farm.state].filter(Boolean).join(", ")}`
                : ""}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/assistant">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Bot className="w-3.5 h-3.5" />}
            >
              Ask Advisor
            </Button>
          </Link>
          <Link href="/farm">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sprout className="w-3.5 h-3.5" />}
            >
              Manage Farm
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. TODAY'S ADVISORY: Strongest Information Section */}
      <section className="rounded-2xl border border-primary-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-primary-700">
              Today&apos;s Advisory
            </span>
            <Badge variant="primary" size="sm">Priority</Badge>
          </div>
          <span className="text-xs text-neutral-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight mb-2">
          {advisory.title}
        </h2>

        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-5 max-w-3xl">
          {advisory.reason}
        </p>

        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-neutral-700 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />
            <span>Recommended Action: {advisory.action}</span>
          </div>

          <Link href={advisory.actionHref}>
            <Button size="sm" variant="secondary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              {advisory.actionLabel}
            </Button>
          </Link>
        </div>
      </section>

      {/* 3. WEATHER & CURRENT CROP & STAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Block (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-primary-600" />
              Microclimate Weather
            </h3>
            {farm?.latitude && (
              <button
                onClick={() => fetchWeather()}
                disabled={isLoadingWeather}
                className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Refresh
              </button>
            )}
          </div>

          {isLoadingWeather ? (
            <WeatherSkeleton />
          ) : weatherError ? (
            <div className="p-5 rounded-xl border border-red-200 bg-red-50/50 text-xs text-red-700 flex items-center justify-between">
              <span>{weatherError}</span>
              <Button size="sm" variant="outline" onClick={() => fetchWeather()}>
                Retry
              </Button>
            </div>
          ) : !farm ? (
            <EmptyState
              title="No Farm Configured"
              description="Configure your farm location coordinates to receive Open-Meteo microclimate weather."
              actionLabel="Set Up Farm"
              actionHref="/onboarding"
            />
          ) : !farm.latitude ? (
            <div className="p-5 rounded-xl border border-warning-border bg-warning-light text-xs text-warning-text flex items-center justify-between">
              <span>Farm coordinates not set. Geocode your location to activate weather.</span>
              <Link href="/farm">
                <Button size="sm" variant="secondary">Set Coordinates</Button>
              </Link>
            </div>
          ) : weather ? (
            <WeatherCard weather={weather as any} />
          ) : null}
        </div>

        {/* Current Crop & Lifecycle Stage (1 col on large screen) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-primary-600" />
              Crop Lifecycle
            </h3>
            <Link href="/crops" className="text-xs text-neutral-500 hover:text-neutral-900">
              Details
            </Link>
          </div>

          <Card className="p-5 space-y-5 shadow-card">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
                Active Crop
              </span>
              <h4 className="text-lg font-semibold text-neutral-900">
                {farm?.current_crop || "Wheat"}
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                {farm?.land_area || 1} Acres • {farm?.irrigation || "Tube-well"}
              </p>
            </div>

            {/* Clean Timeline:
                Planting ●
                Vegetative ●
                Flowering ○
                Fruiting ○
                Harvest ○
            */}
            <div className="pt-2">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-3">
                Lifecycle Stage
              </span>

              <div className="space-y-3 relative pl-6 border-l-2 border-neutral-100 ml-2">
                {lifecycleStages.map((stage, idx) => {
                  const isPastOrCurrent = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <div key={stage.key} className="relative flex items-center justify-between">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[31px] w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isCurrent
                            ? "bg-primary-600 text-white ring-4 ring-primary-100"
                            : isPastOrCurrent
                            ? "bg-primary-600 text-white"
                            : "bg-white border-2 border-neutral-300"
                        }`}
                      >
                        {isPastOrCurrent ? "●" : ""}
                      </span>

                      <span
                        className={`text-xs ${
                          isCurrent
                            ? "font-semibold text-primary-800"
                            : isPastOrCurrent
                            ? "text-neutral-700 font-medium"
                            : "text-neutral-400"
                        }`}
                      >
                        {stage.label}
                      </span>

                      {isCurrent && (
                        <Badge variant="primary" size="sm">
                          Current Stage
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>Day {cycle?.current_day || 42}</span>
              <span>
                {cycle?.expected_harvest_date
                  ? `Est. Harvest: ${new Date(cycle.expected_harvest_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                  : "Est. 65 days to harvest"}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. DAILY FARM PLAN (Task checklist) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary-600" />
            Today&apos;s Farm Plan
          </h3>
          <span className="text-xs text-neutral-400">
            {tasks.filter((t) => t.done).length} of {tasks.length} completed
          </span>
        </div>

        <Card className="divide-y divide-neutral-100 shadow-card">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className="p-3.5 sm:px-5 flex items-center gap-3 cursor-pointer hover:bg-neutral-50/70 transition-colors"
            >
              {task.done ? (
                <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-neutral-300 shrink-0" />
              )}
              <span
                className={`text-xs sm:text-sm select-none ${
                  task.done
                    ? "line-through text-neutral-400 font-normal"
                    : "text-neutral-800 font-medium"
                }`}
              >
                {task.text}
              </span>
            </div>
          ))}
        </Card>
      </section>

      {/* 5. FARM ACTIONS & ANCILLARY MODULES: Health, Fertilizer, Harvest */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900">
          Farm Decision Modules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Crop Health Card */}
          <Card className="p-5 flex flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Crop Health
                </span>
                <HeartPulse className="w-4 h-4 text-primary-600" />
              </div>
              <h4 className="text-base font-semibold text-neutral-900">
                {recentHealth
                  ? recentHealth.detected_condition
                  : "No recent issues reported"}
              </h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                {recentHealth
                  ? `Severity: ${recentHealth.severity}. Confidence: ${(recentHealth.confidence_score * 100).toFixed(0)}%.`
                  : "Upload a foliage photo to check for blight, fungal rust, or insect damage."}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-neutral-100">
              <Link href="/crop-health">
                <Button size="sm" variant="secondary" className="w-full">
                  {recentHealth ? "View Diagnosis" : "Screen Crop Leaf"}
                </Button>
              </Link>
            </div>
          </Card>

          {/* Fertilizer Card */}
          <Card className="p-5 flex flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Fertilizer Dosing
                </span>
                <FlaskConical className="w-4 h-4 text-primary-600" />
              </div>
              <h4 className="text-base font-semibold text-neutral-900">
                Vegetative Stage Dosing
              </h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Soil N: {farm?.nitrogen || 100} • P: {farm?.phosphorus || 50} • K: {farm?.potassium || 50} kg/ha.
                Calculated for {farm?.current_crop || "Wheat"}.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-neutral-100">
              <Link href="/fertilizer">
                <Button size="sm" variant="secondary" className="w-full">
                  View Fertilizer Plan
                </Button>
              </Link>
            </div>
          </Card>

          {/* Harvest & Season Plan Card */}
          <Card className="p-5 flex flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Harvest Planning
                </span>
                <Calendar className="w-4 h-4 text-primary-600" />
              </div>
              <h4 className="text-base font-semibold text-neutral-900">
                {farm?.current_crop || "Wheat"} Season
              </h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Expected maturity window: 60-70 days. Weather forecasts align favorably with current growth pace.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-neutral-100">
              <Link href="/crops">
                <Button size="sm" variant="secondary" className="w-full">
                  Explore Alternatives
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
