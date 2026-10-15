"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api, { FarmData } from "@/lib/api";
import { geocodeFarmLocation, GeocodingSuccess } from "@/lib/location";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, ArrowRight, Check, MapPin, Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, name: "Farmer" },
  { id: 2, name: "Farm" },
  { id: 3, name: "Location" },
  { id: 4, name: "Soil" },
  { id: 5, name: "Current Crop" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Form State
  const [farmerName, setFarmerName] = useState(user?.name || "");
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferred_language || "English");
  const [farmName, setFarmName] = useState("My Farm");
  const [landArea, setLandArea] = useState<number>(2.5);

  const [state, setState] = useState("Punjab");
  const [district, setDistrict] = useState("Ludhiana");
  const [village, setVillage] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(30.9);
  const [longitude, setLongitude] = useState<number | undefined>(75.85);

  const [soilType, setSoilType] = useState("loamy");
  const [soilPh, setSoilPh] = useState<number>(6.8);
  const [nitrogen, setNitrogen] = useState<number>(120);
  const [phosphorus, setPhosphorus] = useState<number>(55);
  const [potassium, setPotassium] = useState<number>(50);

  const [currentCrop, setCurrentCrop] = useState("Wheat");
  const [irrigation, setIrrigation] = useState("Tube-well / Borewell");

  // Auto-fill existing farm if already created
  useEffect(() => {
    async function checkExisting() {
      try {
        const farm = await api.getFarm();
        if (farm) {
          if (farm.farm_name) setFarmName(farm.farm_name);
          if (farm.land_area) setLandArea(farm.land_area);
          if (farm.state) setState(farm.state);
          if (farm.district) setDistrict(farm.district);
          if (farm.village) setVillage(farm.village);
          if (farm.latitude) setLatitude(farm.latitude);
          if (farm.longitude) setLongitude(farm.longitude);
          if (farm.soil_type) setSoilType(farm.soil_type);
          if (farm.soil_ph) setSoilPh(farm.soil_ph);
          if (farm.nitrogen) setNitrogen(farm.nitrogen);
          if (farm.phosphorus) setPhosphorus(farm.phosphorus);
          if (farm.potassium) setPotassium(farm.potassium);
          if (farm.current_crop) setCurrentCrop(farm.current_crop);
          if (farm.irrigation) setIrrigation(farm.irrigation);
        }
      } catch {
        // First time farmer, ignore
      }
    }
    checkExisting();
  }, []);

  const handleLookupCoordinates = async () => {
    if (!state.trim() && !district.trim() && !village.trim()) {
      toastError("Please enter a state or district first.");
      return;
    }

    setIsGeocoding(true);
    try {
      const result = await geocodeFarmLocation({ village, district, state });
      if (result && result.latitude !== undefined && result.longitude !== undefined) {
        setLatitude(result.latitude);
        setLongitude(result.longitude);
        success(`Located: ${result.resolvedName}`);
      } else {
        toastError("Location coordinates not found.");
      }
    } catch (err: any) {
      toastError(err?.message || "Location coordinates not found.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const payload: Partial<FarmData> = {
        farm_name: farmName.trim() || "My Farm",
        state: state.trim() || undefined,
        district: district.trim() || undefined,
        village: village.trim() || undefined,
        land_area: Number(landArea) || 1,
        soil_type: soilType,
        soil_ph: Number(soilPh) || 6.5,
        nitrogen: Number(nitrogen) || 100,
        phosphorus: Number(phosphorus) || 50,
        potassium: Number(potassium) || 50,
        irrigation,
        current_crop: currentCrop,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      };

      const existing = await api.getFarm();
      if (existing && existing.id) {
        await api.updateFarm(payload);
      } else {
        await api.createFarm(payload);
      }

      success("Farm setup complete!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save farm setup.";
      toastError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Header and Progress Indicator */}
      <div className="text-center mb-8">
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Farm Setup
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Tell Agrimind about your land to personalize weather and crop advisories.
        </p>

        {/* Minimal Progress Indicator: ●────●────○────○────○ */}
        <div className="flex items-center justify-center gap-1.5 mt-6 max-w-sm mx-auto">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    step.id < currentStep
                      ? "bg-primary-600 text-white"
                      : step.id === currentStep
                      ? "border-2 border-primary-600 text-primary-700 bg-white"
                      : "border border-neutral-300 text-neutral-400 bg-white"
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 hidden sm:block">
                  {step.name}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 sm:w-12 transition-colors mb-3 sm:mb-4 ${
                    step.id < currentStep ? "bg-primary-600" : "bg-neutral-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="shadow-card">
        {/* Step 1: Farmer Information */}
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle>Farmer Information</CardTitle>
              <CardDescription>
                How Agrimind should address you and what language you prefer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Your Name"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder="Surya Sharma"
              />
              <Select
                label="Preferred Language"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Marathi">Marathi (मराठी)</option>
              </Select>
            </CardContent>
          </>
        )}

        {/* Step 2: Farm Information */}
        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle>Farm Information</CardTitle>
              <CardDescription>
                Basic details about your farm estate or field.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Farm Name"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Greenfield Farm"
                required
              />
              <Input
                label="Land Area (in Acres)"
                type="number"
                step="0.1"
                min="0.1"
                value={landArea}
                onChange={(e) => setLandArea(parseFloat(e.target.value) || 1)}
                helperText="Approximate cultivated land size"
              />
            </CardContent>
          </>
        )}

        {/* Step 3: Location */}
        {currentStep === 3 && (
          <>
            <CardHeader>
              <CardTitle>Farm Location</CardTitle>
              <CardDescription>
                Used to retrieve precise Open-Meteo microclimate weather and rain forecasts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Punjab"
                />
                <Input
                  label="District / Region"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Ludhiana"
                />
              </div>

              <Input
                label="Village / Landmark (Optional)"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Khanna"
              />

              <div className="pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleLookupCoordinates}
                  isLoading={isGeocoding}
                  leftIcon={<MapPin className="w-3.5 h-3.5" />}
                >
                  Locate Coordinates Automatically
                </Button>
              </div>

              {latitude !== undefined && longitude !== undefined && (
                <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-center justify-between">
                  <span>Coordinates: {latitude.toFixed(2)}°N, {longitude.toFixed(2)}°E</span>
                  <span className="text-primary-700 font-medium">Ready for weather</span>
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* Step 4: Soil Information */}
        {currentStep === 4 && (
          <>
            <CardHeader>
              <CardTitle>Soil Information</CardTitle>
              <CardDescription>
                Soil parameters guide crop selection and fertilizer dosing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Soil Texture / Type"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
              >
                <option value="loamy">Loamy (Balanced, optimal)</option>
                <option value="clay">Clay (High water retention)</option>
                <option value="sandy">Sandy (High drainage)</option>
                <option value="silt">Silt (Fertile, fine)</option>
                <option value="alluvial">Alluvial (River basin)</option>
                <option value="black">Black / Regur (Cotton soil)</option>
                <option value="red">Red Soil</option>
              </Select>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input
                  label="pH"
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={soilPh}
                  onChange={(e) => setSoilPh(parseFloat(e.target.value) || 6.5)}
                />
                <Input
                  label="Nitrogen (N)"
                  type="number"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(parseFloat(e.target.value) || 0)}
                  helperText="kg/ha"
                />
                <Input
                  label="Phosphorus (P)"
                  type="number"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(parseFloat(e.target.value) || 0)}
                  helperText="kg/ha"
                />
                <Input
                  label="Potassium (K)"
                  type="number"
                  value={potassium}
                  onChange={(e) => setPotassium(parseFloat(e.target.value) || 0)}
                  helperText="kg/ha"
                />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 5: Current Crop */}
        {currentStep === 5 && (
          <>
            <CardHeader>
              <CardTitle>Current Crop & Irrigation</CardTitle>
              <CardDescription>
                What are you currently cultivating in your main field?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Current Primary Crop"
                value={currentCrop}
                onChange={(e) => setCurrentCrop(e.target.value)}
              >
                <option value="Wheat">Wheat</option>
                <option value="Rice (Paddy)">Rice (Paddy)</option>
                <option value="Maize">Maize (Corn)</option>
                <option value="Cotton">Cotton</option>
                <option value="Sugarcane">Sugarcane</option>
                <option value="Tomato">Tomato</option>
                <option value="Potato">Potato</option>
                <option value="Groundnut">Groundnut (Peanut)</option>
                <option value="Soybean">Soybean</option>
                <option value="Other">Other / Fallow</option>
              </Select>

              <Select
                label="Irrigation Method"
                value={irrigation}
                onChange={(e) => setIrrigation(e.target.value)}
              >
                <option value="Drip Irrigation">Drip Irrigation</option>
                <option value="Sprinkler System">Sprinkler System</option>
                <option value="Tube-well / Borewell">Tube-well / Borewell</option>
                <option value="Canal Irrigation">Canal Irrigation</option>
                <option value="Rainfed (Natural)">Rainfed (Natural)</option>
                <option value="Flood / Furrow">Flood / Furrow</option>
              </Select>
            </CardContent>
          </>
        )}

        {/* Navigation Actions */}
        <CardFooter>
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Next Step
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleComplete}
              rightIcon={<Check className="w-3.5 h-3.5" />}
            >
              Save & Finish Setup
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
