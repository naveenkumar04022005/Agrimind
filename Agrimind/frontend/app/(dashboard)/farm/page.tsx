"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api, { FarmData } from "@/lib/api";
import { geocodeFarmLocation } from "@/lib/location";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { MapPin, CheckCircle2, RotateCw } from "lucide-react";

export default function FarmPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [existingFarmId, setExistingFarmId] = useState<string | null>(null);

  // Grouped Section 1: Farm
  const [farmName, setFarmName] = useState("");
  const [landArea, setLandArea] = useState<number>(1);

  // Grouped Section 2: Location
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();

  // Grouped Section 3: Soil
  const [soilType, setSoilType] = useState("loamy");
  const [soilPh, setSoilPh] = useState<number>(6.5);
  const [nitrogen, setNitrogen] = useState<number>(100);
  const [phosphorus, setPhosphorus] = useState<number>(50);
  const [potassium, setPotassium] = useState<number>(50);

  // Grouped Section 4: Irrigation
  const [irrigation, setIrrigation] = useState("Tube-well / Borewell");

  // Grouped Section 5: Crop
  const [currentCrop, setCurrentCrop] = useState("Wheat");

  // Load existing farm data
  useEffect(() => {
    async function loadFarm() {
      if (!user) return;
      try {
        const farm = await api.getFarm();
        if (farm) {
          if (farm.id) setExistingFarmId(farm.id);
          setFarmName(farm.farm_name || "");
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
          if (farm.irrigation) setIrrigation(farm.irrigation);
          if (farm.current_crop) setCurrentCrop(farm.current_crop);
        }
      } catch (err) {
        console.error("Failed to load farm:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFarm();
  }, [user]);

  const handleLookupCoordinates = async () => {
    if (!state.trim() && !district.trim() && !village.trim()) {
      toastError("Enter state or district to locate coordinates.");
      return;
    }
    setIsGeocoding(true);
    try {
      const result = await geocodeFarmLocation({ village, district, state });
      if (result && result.latitude !== undefined && result.longitude !== undefined) {
        setLatitude(result.latitude);
        setLongitude(result.longitude);
        success(`Located coordinates: ${result.resolvedName}`);
      } else {
        toastError("Location coordinates not found.");
      }
    } catch (err: any) {
      toastError(err?.message || "Location not found.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) {
      toastError("Please provide a farm name.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<FarmData> = {
        farm_name: farmName.trim(),
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
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
      };

      if (existingFarmId) {
        await api.updateFarm(payload);
      } else {
        await api.createFarm(payload);
      }

      success("Farm saved successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save farm.";
      toastError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 space-y-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Farm Profile
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Configure physical parameters for telemetry, soil modeling, and advisories.
        </p>
      </div>

      <form onSubmit={handleSaveFarm} className="space-y-6">
        <Card className="divide-y divide-neutral-100 shadow-card">
          {/* Section 1: Farm */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Farm</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                General details regarding your agricultural plot.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Farm Name"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g. Green Valley Farm"
                required
              />
              <Input
                label="Land Area (Acres)"
                type="number"
                step="0.1"
                min="0.1"
                value={landArea}
                onChange={(e) => setLandArea(parseFloat(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Location</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Geographic location required for microclimate weather feeds.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Punjab"
              />
              <Input
                label="District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Ludhiana"
              />
              <Input
                label="Village / Local Area"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Khanna"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleLookupCoordinates}
                isLoading={isGeocoding}
                leftIcon={<MapPin className="w-3.5 h-3.5" />}
              >
                Auto-Detect Coordinates
              </Button>

              {latitude !== undefined && longitude !== undefined ? (
                <div className="text-xs text-neutral-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                  <span>
                    Lat: {latitude.toFixed(3)}°, Lon: {longitude.toFixed(3)}°
                  </span>
                </div>
              ) : (
                <span className="text-xs text-neutral-400">
                  Coordinates not set yet
                </span>
              )}
            </div>
          </div>

          {/* Section 3: Soil */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Soil</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Soil composition and baseline chemical characteristics.
              </p>
            </div>

            <Select
              label="Soil Texture / Classification"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
            >
              <option value="loamy">Loamy (Balanced moisture & aeration)</option>
              <option value="clay">Clay (High water retention)</option>
              <option value="sandy">Sandy (High drainage, porous)</option>
              <option value="silt">Silt (Fine textured, fertile)</option>
              <option value="alluvial">Alluvial (Riverbed sedimentary)</option>
              <option value="black">Black / Regur (High lime/magnesium)</option>
              <option value="red">Red Soil</option>
              <option value="other">Other / Mixed</option>
            </Select>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Soil pH"
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
          </div>

          {/* Section 4: Irrigation */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Irrigation</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Primary watering infrastructure in place.
              </p>
            </div>
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
              <option value="Other">Other</option>
            </Select>
          </div>

          {/* Section 5: Crop */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Crop</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Active crop currently cultivated on this parcel.
              </p>
            </div>
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
          </div>

          {/* Primary & Secondary Actions */}
          <div className="p-6 bg-neutral-50/60 rounded-b-xl flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              isLoading={isSaving}
            >
              Save Farm
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
