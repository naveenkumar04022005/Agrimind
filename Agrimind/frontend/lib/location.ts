/**
 * Agrimind Location Intelligence Utility
 *
 * Provides reusable functions for:
 * 1. Geocoding Village + District + State into precise latitude and longitude using Open-Meteo Geocoding API.
 * 2. Hierarchical fallback resolution (Village -> District Center).
 * 3. Validation and formatting of geographic coordinates.
 *
 * No hardcoded coordinates are used.
 */

export interface OpenMeteoLocationItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  admin1?: string; // State / Province
  admin2?: string; // District
  admin3?: string; // Subdistrict / Tehsil
  timezone?: string;
  population?: number;
}

export interface OpenMeteoGeocodingResponse {
  results?: OpenMeteoLocationItem[];
  generationtime_ms?: number;
}

export interface GeocodingParams {
  village?: string;
  district?: string;
  state?: string;
  country?: string;
}

export interface GeocodingSuccess {
  latitude: number;
  longitude: number;
  elevation: number | null;
  resolvedName: string;
  admin1: string | null; // State
  admin2: string | null; // District
  country: string | null;
  matchLevel: "exact_village" | "district_fallback" | "state_fallback";
  source: "open_meteo";
}

export class GeocodingError extends Error {
  public canRetry: boolean;

  constructor(message: string, canRetry: boolean = true) {
    super(message);
    this.name = "GeocodingError";
    this.canRetry = canRetry;
  }
}

/**
 * Validates whether latitude and longitude are valid numeric values within global limits.
 */
export function hasValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): boolean {
  if (latitude === null || latitude === undefined || isNaN(latitude)) return false;
  if (longitude === null || longitude === undefined || isNaN(longitude)) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

/**
 * Formats coordinates for clean UI presentation.
 */
export function formatCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  precision: number = 4
): string {
  if (!hasValidCoordinates(latitude, longitude)) return "Not Available";
  const latDir = (latitude ?? 0) >= 0 ? "N" : "S";
  const lngDir = (longitude ?? 0) >= 0 ? "E" : "W";
  return `${Math.abs(latitude ?? 0).toFixed(precision)}° ${latDir}, ${Math.abs(
    longitude ?? 0
  ).toFixed(precision)}° ${lngDir}`;
}

/**
 * Sanitizes input query string for Open-Meteo URL compatibility.
 */
function cleanQueryString(text: string): string {
  return text.trim().replace(/[^\w\s-]/gi, "");
}

/**
 * Normalizes string for case-insensitive matching.
 */
function normalizeString(text?: string | null): string {
  return (text || "").toLowerCase().replace(/district|block|tehsil|mandal/gi, "").trim();
}

/**
 * Internal query helper for the Open-Meteo Geocoding REST API.
 */
async function queryOpenMeteo(
  query: string,
  count: number = 10
): Promise<OpenMeteoLocationItem[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=${count}&language=en&format=json`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second network timeout

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new GeocodingError(
        `Open-Meteo geocoding service returned HTTP status ${res.status}.`,
        true
      );
    }

    const data: OpenMeteoGeocodingResponse = await res.json();
    return data.results || [];
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof GeocodingError) throw err;

    const isAbort =
      err instanceof DOMException && err.name === "AbortError";
    const errorMsg = isAbort
      ? "Geocoding request timed out. Please check your internet connection."
      : (err as Error).message || "Network error while connecting to Open-Meteo API.";

    throw new GeocodingError(errorMsg, true);
  }
}

/**
 * Converts Village + District + State into precise latitude & longitude.
 *
 * Implements disambiguation by matching against state (admin1) and district (admin2),
 * and falls back to district-level center if a small village is not listed in global gazetteers.
 */
export async function geocodeFarmLocation(
  params: GeocodingParams
): Promise<GeocodingSuccess> {
  const village = params.village?.trim();
  const district = params.district?.trim();
  const state = params.state?.trim();

  if (!village && !district && !state) {
    throw new GeocodingError(
      "Please provide at least a Village, District, or State to resolve coordinates.",
      false
    );
  }

  const normState = normalizeString(state);
  const normDistrict = normalizeString(district);

  // Strategy 1: Search by Village name if provided
  if (village) {
    const villageQuery = cleanQueryString(village);
    if (villageQuery.length >= 2) {
      const results = await queryOpenMeteo(villageQuery, 10);

      if (results.length > 0) {
        // Try exact match on State (admin1) and District (admin2)
        const bestMatch = results.find((item) => {
          const itemState = normalizeString(item.admin1);
          const itemDistrict = normalizeString(item.admin2);

          const stateMatches = !normState || itemState.includes(normState) || normState.includes(itemState);
          const districtMatches = !normDistrict || itemDistrict.includes(normDistrict) || normDistrict.includes(itemDistrict);

          return stateMatches && districtMatches;
        });

        if (bestMatch) {
          return {
            latitude: bestMatch.latitude,
            longitude: bestMatch.longitude,
            elevation: bestMatch.elevation ?? null,
            resolvedName: `${bestMatch.name}, ${bestMatch.admin2 || ""}, ${bestMatch.admin1 || ""}`,
            admin1: bestMatch.admin1 ?? null,
            admin2: bestMatch.admin2 ?? null,
            country: bestMatch.country ?? null,
            matchLevel: "exact_village",
            source: "open_meteo",
          };
        }

        // Try match on State only
        const stateMatch = results.find((item) => {
          const itemState = normalizeString(item.admin1);
          return normState && (itemState.includes(normState) || normState.includes(itemState));
        });

        if (stateMatch) {
          return {
            latitude: stateMatch.latitude,
            longitude: stateMatch.longitude,
            elevation: stateMatch.elevation ?? null,
            resolvedName: `${stateMatch.name}, ${stateMatch.admin1 || ""}`,
            admin1: stateMatch.admin1 ?? null,
            admin2: stateMatch.admin2 ?? null,
            country: stateMatch.country ?? null,
            matchLevel: "exact_village",
            source: "open_meteo",
          };
        }
      }
    }
  }

  // Strategy 2: Fallback to District center
  if (district) {
    const districtQuery = cleanQueryString(district);
    if (districtQuery.length >= 2) {
      const results = await queryOpenMeteo(districtQuery, 10);

      if (results.length > 0) {
        const districtMatch = results.find((item) => {
          const itemState = normalizeString(item.admin1);
          return !normState || itemState.includes(normState) || normState.includes(itemState);
        }) || results[0];

        return {
          latitude: districtMatch.latitude,
          longitude: districtMatch.longitude,
          elevation: districtMatch.elevation ?? null,
          resolvedName: `${districtMatch.name} (District Center), ${districtMatch.admin1 || ""}`,
          admin1: districtMatch.admin1 ?? null,
          admin2: districtMatch.admin2 ?? null,
          country: districtMatch.country ?? null,
          matchLevel: "district_fallback",
          source: "open_meteo",
        };
      }
    }
  }

  // Strategy 3: Fallback to State capital / central coordinates
  if (state) {
    const stateQuery = cleanQueryString(state);
    const results = await queryOpenMeteo(stateQuery, 5);
    if (results.length > 0) {
      const stateMatch = results[0];
      return {
        latitude: stateMatch.latitude,
        longitude: stateMatch.longitude,
        elevation: stateMatch.elevation ?? null,
        resolvedName: `${stateMatch.name} (State Center)`,
        admin1: stateMatch.admin1 ?? null,
        admin2: stateMatch.admin2 ?? null,
        country: stateMatch.country ?? null,
        matchLevel: "state_fallback",
        source: "open_meteo",
      };
    }
  }

  throw new GeocodingError(
    `Could not locate coordinates for "${[village, district, state].filter(Boolean).join(", ")}". Please check the spelling or enter coordinates manually.`,
    true
  );
}
