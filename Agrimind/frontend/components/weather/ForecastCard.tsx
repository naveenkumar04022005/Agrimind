"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getWeatherConditionIcon } from "./WeatherCard";
import { Droplets } from "lucide-react";

export interface ForecastDay {
  date: string;
  weather_code: number;
  condition: string;
  temperature_max: number;
  temperature_min: number;
  precipitation_sum?: number;
  precipitation?: number;
  rain_probability?: number;
  precipitation_probability?: number;
}

export function ForecastCard({ forecasts }: { forecasts: ForecastDay[] }) {
  if (!forecasts || forecasts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-neutral-900">
          7-Day Agricultural Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-neutral-100">
          {forecasts.slice(0, 7).map((day, idx) => {
            const dateObj = new Date(day.date);
            const isToday = idx === 0;
            const dayName = isToday
              ? "Today"
              : dateObj.toLocaleDateString("en-US", { weekday: "short" });
            const dateStr = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const rainProb =
              day.rain_probability ?? day.precipitation_probability ?? 0;
            const rainAmount = day.precipitation_sum ?? day.precipitation ?? 0;

            return (
              <div
                key={day.date}
                className="flex items-center justify-between px-5 py-3 text-xs hover:bg-neutral-50/70 transition-colors"
              >
                {/* Date & Day */}
                <div className="w-24">
                  <span className="font-medium text-neutral-900 block">
                    {dayName}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {dateStr}
                  </span>
                </div>

                {/* Condition Icon + Label */}
                <div className="flex items-center gap-2.5 flex-1 pl-2">
                  {getWeatherConditionIcon(day.weather_code, "w-4 h-4")}
                  <span className="text-neutral-700 capitalize truncate max-w-[140px]">
                    {day.condition || "Clear"}
                  </span>
                </div>

                {/* Precipitation */}
                <div className="flex items-center gap-1.5 w-20 text-neutral-500">
                  <Droplets className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{rainProb}%</span>
                  {rainAmount > 0 && (
                    <span className="text-[10px] text-neutral-400">
                      ({rainAmount}mm)
                    </span>
                  )}
                </div>

                {/* Temperature High / Low */}
                <div className="text-right w-20 font-medium">
                  <span className="text-neutral-900">
                    {Math.round(day.temperature_max)}°
                  </span>
                  <span className="text-neutral-400 ml-1.5">
                    {Math.round(day.temperature_min)}°
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
