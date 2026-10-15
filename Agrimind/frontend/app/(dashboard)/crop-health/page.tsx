"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import api, { FarmData } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  Upload,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  RefreshCw,
  X,
  ShieldAlert,
} from "lucide-react";

export default function CropHealthPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [farm, setFarm] = useState<FarmData | null>(null);
  const [crop, setCrop] = useState("General");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  // Past reports
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load farm & history
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [farmData, reportList] = await Promise.allSettled([
          api.getFarm(),
          api.getCropHealthReports(),
        ]);
        if (farmData.status === "fulfilled" && farmData.value) {
          setFarm(farmData.value);
          if (farmData.value.current_crop) setCrop(farmData.value.current_crop);
        }
        if (reportList.status === "fulfilled" && Array.isArray(reportList.value)) {
          setReports(reportList.value);
        }
      } catch (err) {
        console.error("Error loading crop health data:", err);
      } finally {
        setIsLoadingReports(false);
      }
    }
    loadData();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toastError("Please select an image file (JPEG, PNG, WEBP).");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toastError("Please choose or upload a leaf image first.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const diagnosis = await api.analyzeCropHealth(
        selectedFile,
        crop,
        farm?.id
      );
      setResult(diagnosis);
      success("Diagnosis complete.");
      // Refresh reports list
      api.getCropHealthReports().then((reps) => {
        if (Array.isArray(reps)) setReports(reps);
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Diagnostic analysis failed.";
      toastError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isLowConfidence = result && result.confidence_score < 0.65;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Crop Health
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Upload a clear crop image to check for possible issues.
        </p>
      </div>

      {/* Main Upload / Analyze Experience */}
      <Card className="p-6 sm:p-8 shadow-card space-y-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* State A: Initial Empty / Upload State */}
        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-200 hover:border-neutral-300 rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors bg-neutral-50/50 hover:bg-neutral-50"
          >
            <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 mx-auto mb-4">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
              Upload a clear crop image
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4 leading-relaxed">
              Take a focused close-up photo of diseased or discolored leaves in natural sunlight.
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Upload Image
            </Button>
          </div>
        ) : (
          /* State B: Image Preview & Analyze Action */
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 max-h-80 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Crop preview"
                className="max-h-80 w-auto object-contain mx-auto"
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-neutral-600 hover:text-neutral-900 shadow-sm transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="w-full sm:w-48">
                <Select
                  label="Target Crop"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                >
                  <option value="General">General / Auto</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Potato">Potato</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Corn">Maize (Corn)</option>
                </Select>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto pt-4 sm:pt-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={isAnalyzing}
                >
                  Change Image
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAnalyze}
                  isLoading={isAnalyzing}
                  leftIcon={<HeartPulse className="w-3.5 h-3.5" />}
                >
                  Analyze Plant Health
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Result Section */}
      {result && (
        <Card className="p-6 sm:p-7 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-100">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 block mb-1">
                Possible Condition
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
                {result.detected_condition}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={
                  result.severity === "high" || result.severity === "severe"
                    ? "error"
                    : result.severity === "medium" || result.severity === "moderate"
                    ? "warning"
                    : "success"
                }
              >
                Severity: {result.severity || "Moderate"}
              </Badge>
              <Badge variant="neutral">
                Confidence: {(result.confidence_score * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>

          {/* Uncertainty notice if confidence is low */}
          {isLowConfidence && (
            <div className="p-4 rounded-lg bg-warning-light border border-warning-border flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-warning-text shrink-0 mt-0.5" />
              <div className="text-xs text-warning-text">
                <p className="font-semibold">Result is uncertain</p>
                <p className="mt-0.5">
                  Confidence score is below standard validation threshold. Consider additional inspection or expert verification before applying chemical remedies.
                </p>
              </div>
            </div>
          )}

          {/* What to do next: Symptoms, Organic Treatment, Chemical Treatment */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
              What to do next
            </h3>

            {result.recommendation && (
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                {result.recommendation}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {result.organic_treatment && (
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-700 block">
                    Organic Treatment
                  </span>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {result.organic_treatment}
                  </p>
                </div>
              )}

              {result.chemical_treatment && (
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600 block">
                    Chemical Treatment
                  </span>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {result.chemical_treatment}
                  </p>
                </div>
              )}
            </div>

            {result.preventive_measures && (
              <div className="p-3.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-500">
                <span className="font-medium text-neutral-800">Preventive Measures: </span>
                {result.preventive_measures}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Diagnostic History */}
      {reports.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900">
            Recent Diagnostic Reports
          </h3>
          <Card className="divide-y divide-neutral-100 shadow-card">
            {reports.slice(0, 5).map((rep) => (
              <div
                key={rep.id}
                className="p-4 flex items-center justify-between text-xs hover:bg-neutral-50/70 transition-colors"
              >
                <div>
                  <span className="font-semibold text-neutral-900 block">
                    {rep.detected_condition}
                  </span>
                  <span className="text-neutral-400 text-[11px]">
                    Crop: {rep.crop} • {new Date(rep.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">
                    {(rep.confidence_score * 100).toFixed(0)}%
                  </Badge>
                  <span className="text-neutral-500 capitalize">{rep.severity}</span>
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
