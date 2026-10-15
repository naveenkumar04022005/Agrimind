"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  ArrowLeft,
  Server,
  Database,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface TestResult {
  step: string;
  status: "pending" | "success" | "error" | "warning";
  message: string;
  latencyMs?: number;
  details?: string;
}

export default function SystemDiagnosticsPage() {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [overallStatus, setOverallStatus] = useState<
    "idle" | "testing" | "success" | "warning" | "error"
  >("idle");
  const [results, setResults] = useState<TestResult[]>([]);

  const runDiagnostics = useCallback(async () => {
    setIsRunning(true);
    setOverallStatus("testing");

    const testSteps: TestResult[] = [];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Step 1: FastAPI Health Endpoint
    const t0 = performance.now();
    try {
      const res = await fetch(`${apiUrl}/api/health`, { method: "GET" });
      const latency = Math.round(performance.now() - t0);
      if (res.ok) {
        testSteps.push({
          step: "FastAPI Backend Connection",
          status: "success",
          message: `Connected to ${apiUrl} (200 OK)`,
          latencyMs: latency,
        });
      } else {
        testSteps.push({
          step: "FastAPI Backend Connection",
          status: "error",
          message: `Backend returned status ${res.status}`,
          latencyMs: latency,
        });
      }
    } catch (err: unknown) {
      const latency = Math.round(performance.now() - t0);
      testSteps.push({
        step: "FastAPI Backend Connection",
        status: "error",
        message: `Failed to connect to ${apiUrl}`,
        latencyMs: latency,
        details: err instanceof Error ? err.message : String(err),
      });
    }

    // Step 2: Open-Meteo Geocoding
    const t1 = performance.now();
    try {
      const res = await fetch(
        "https://geocoding-api.open-meteo.com/v1/search?name=Delhi&count=1&language=en&format=json"
      );
      const latency = Math.round(performance.now() - t1);
      if (res.ok) {
        testSteps.push({
          step: "Open-Meteo Geocoding Service",
          status: "success",
          message: "Geocoding API responded normally",
          latencyMs: latency,
        });
      } else {
        testSteps.push({
          step: "Open-Meteo Geocoding Service",
          status: "warning",
          message: `Open-Meteo returned status ${res.status}`,
          latencyMs: latency,
        });
      }
    } catch {
      testSteps.push({
        step: "Open-Meteo Geocoding Service",
        status: "warning",
        message: "Network request failed to geocoding endpoint",
      });
    }

    setResults(testSteps);
    const hasError = testSteps.some((s) => s.status === "error");
    const hasWarning = testSteps.some((s) => s.status === "warning");
    setOverallStatus(hasError ? "error" : hasWarning ? "warning" : "success");
    setIsRunning(false);
  }, []);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <Button
            size="sm"
            variant="secondary"
            onClick={runDiagnostics}
            isLoading={isRunning}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Re-run Tests
          </Button>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            System Connectivity Diagnostics
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time validation of local services and external telemetry feeds.
          </p>
        </div>

        {/* Summary Card */}
        <Card className="p-5 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-400 block">Overall Status</span>
              <span className="text-sm font-semibold text-neutral-900 capitalize">
                {overallStatus === "testing" ? "Running tests..." : overallStatus}
              </span>
            </div>
          </div>

          <Badge
            variant={
              overallStatus === "success"
                ? "success"
                : overallStatus === "error"
                ? "error"
                : "neutral"
            }
          >
            {overallStatus.toUpperCase()}
          </Badge>
        </Card>

        {/* Test Steps */}
        <Card className="divide-y divide-neutral-100 shadow-card">
          {results.map((r, i) => (
            <div key={i} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {r.status === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
                ) : r.status === "error" ? (
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-neutral-900 block">
                    {r.step}
                  </span>
                  <span className="text-neutral-500">{r.message}</span>
                </div>
              </div>

              {r.latencyMs !== undefined && (
                <span className="text-neutral-400 font-mono text-[11px]">
                  {r.latencyMs}ms
                </span>
              )}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
