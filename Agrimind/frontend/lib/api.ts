/**
 * Agrimind Centralized API Client
 * Interfaces directly with FastAPI backend.
 * Replaces all direct database and Supabase client queries.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "agrimind_jwt_token";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: string;
  phone_number?: string;
  preferred_language: string;
  state?: string;
  district?: string;
  village?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface FarmData {
  id?: string;
  user_id?: string;
  farm_name: string;
  state?: string;
  district?: string;
  village?: string;
  land_area?: number;
  soil_type?: string;
  soil_ph?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  irrigation?: string;
  current_crop?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export interface WeatherDataResponse {
  location: {
    latitude: number;
    longitude: number;
    farm_id?: string;
    farm_name?: string;
    timezone: string;
    elevation_meters?: number;
  };
  current: {
    temperature: number;
    apparent_temperature: number;
    relative_humidity: number;
    humidity: number;
    precipitation: number;
    weather_code: number;
    condition: string;
    weather_description: string;
    wind_speed: number;
    wind_direction: number;
    surface_pressure: number;
    is_day: boolean;
    observed_at: string;
  };
  daily: Array<{
    date: string;
    weather_code: number;
    condition: string;
    weather_description: string;
    temperature_max: number;
    temperature_min: number;
    precipitation_sum: number;
    precipitation_probability: number;
    wind_speed_max: number;
  }>;
}

class ApiClient {
  private get baseUrl(): string {
    return API_BASE_URL.replace(/\/+$/, "");
  }

  public getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  public removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers = new Headers(options.headers || {});

    // Attach JWT if available
    const token = this.getToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (err: unknown) {
      throw new Error("Unable to connect to Agrimind backend service. Please ensure the backend is running.");
    }

    if (response.status === 401) {
      this.removeToken();
      // Only redirect on client side if not on auth pages
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        window.location.href = `/login?redirectTo=${encodeURIComponent(window.location.pathname)}`;
      }
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.detail || "Session expired. Please log in again.");
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const detail = errJson?.detail || `API request failed with status ${response.status}`;
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }

    return response.json();
  }

  // ==================== AUTHENTICATION ====================

  public async register(payload: {
    name?: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  public async login(payload: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  public async loginWithGoogle(payload: {
    credential?: string;
    email?: string;
    name?: string;
    avatar_url?: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  public async logout(): Promise<void> {
    try {
      await this.request("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.removeToken();
    }
  }

  public async getCurrentUser(): Promise<UserProfile> {
    return this.request<UserProfile>("/api/auth/me", { method: "GET" });
  }

  // ==================== FARMS ====================

  public async getFarm(): Promise<FarmData | null> {
    try {
      return await this.request<FarmData>("/api/farms/me", { method: "GET" });
    } catch (err: any) {
      if (err.message && err.message.includes("404")) {
        return null;
      }
      return null;
    }
  }

  public async createFarm(farmData: Partial<FarmData>): Promise<FarmData> {
    return this.request<FarmData>("/api/farms", {
      method: "POST",
      body: JSON.stringify(farmData),
    });
  }

  public async updateFarm(farmData: Partial<FarmData>): Promise<FarmData> {
    return this.request<FarmData>("/api/farms/me", {
      method: "PUT",
      body: JSON.stringify(farmData),
    });
  }

  public async deleteFarm(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/api/farms/me", {
      method: "DELETE",
    });
  }

  // ==================== WEATHER ====================

  public async getWeather(): Promise<WeatherDataResponse> {
    return this.request<WeatherDataResponse>("/api/weather", { method: "GET" });
  }

  // ==================== CROP RECOMMENDATIONS ====================

  public async getCropRecommendation(payload: Record<string, any>): Promise<any> {
    return this.request("/api/crops/recommend", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  public async saveCropRecommendation(payload: {
    farm_id: string;
    recommended_crop_name: string;
    confidence_score: number;
    alternatives: any[];
    rationale?: string;
  }): Promise<any> {
    return this.request("/api/crops/save", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  public async getCropRecommendationHistory(farmId?: string): Promise<any[]> {
    const query = farmId ? `?farm_id=${encodeURIComponent(farmId)}` : "";
    return this.request(`/api/crops/history${query}`, { method: "GET" });
  }

  // ==================== FERTILIZER ====================

  public async getFertilizerRecommendation(payload: {
    crop: string;
    growth_stage?: string;
    farm_area_acres?: number;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    soil_ph?: number;
    farm_id?: string;
  }): Promise<any> {
    return this.request("/api/fertilizer/recommend", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ==================== CROP HEALTH ====================

  public async analyzeCropHealth(
    file: File,
    crop: string = "General",
    farmId?: string
  ): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("crop", crop);
    if (farmId) {
      formData.append("farm_id", farmId);
    }
    return this.request("/api/crop-health/analyze", {
      method: "POST",
      body: formData,
    });
  }

  public async getCropHealthReports(): Promise<any[]> {
    return this.request("/api/crop-health/reports", { method: "GET" });
  }

  // ==================== CROP LIFECYCLE ====================

  public async getCropCycle(farmId?: string): Promise<any | null> {
    const query = farmId ? `?farm_id=${encodeURIComponent(farmId)}` : "";
    return this.request(`/api/crops/cycles/current${query}`, { method: "GET" });
  }

  public async createCropCycle(payload: {
    farm_id?: string;
    cycle_name: string;
    crop_name?: string;
    area_planted_acres: number;
    sowing_date: string;
    expected_duration_days: number;
    notes?: string;
  }): Promise<any> {
    return this.request("/api/crops/cycles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  public async updateCropCycle(
    cycleId: string,
    payload: {
      current_stage?: string;
      status?: string;
      actual_harvest_date?: string;
      actual_yield_kg?: number;
      notes?: string;
    }
  ): Promise<any> {
    return this.request(`/api/crops/cycles/${cycleId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  // ==================== AI ASSISTANT ====================

  public async sendAssistantMessage(payload: {
    message: string;
    conversation_id?: string;
    farm_id?: string;
  }): Promise<any> {
    return this.request("/api/assistant/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  public async getConversations(): Promise<any[]> {
    return this.request("/api/assistant/conversations", { method: "GET" });
  }

  public async getConversation(conversationId: string): Promise<any> {
    return this.request(`/api/assistant/conversations/${conversationId}`, {
      method: "GET",
    });
  }

  public async deleteConversation(conversationId: string): Promise<void> {
    return this.request(`/api/assistant/conversations/${conversationId}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient();
export default api;
