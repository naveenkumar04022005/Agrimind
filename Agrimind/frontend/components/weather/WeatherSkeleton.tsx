"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function WeatherSkeleton() {
  return (
    <div className="space-y-4">
      {/* Weather card skeleton */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-5 border-b border-neutral-100">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-3 w-20" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </Card>

      {/* Insight banner skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 flex items-start gap-3">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  );
}
