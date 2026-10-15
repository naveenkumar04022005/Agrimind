# Agrimind Farm Location Intelligence

This document details the location intelligence architecture for resolving rural agricultural properties to precise geographic coordinates (`latitude`, `longitude`, and `elevation`) using the **Open-Meteo Geocoding API** and Supabase PostgreSQL persistence.

---

## 🛰️ Architecture & Principles

1. **Zero Hardcoded Coordinates**: Coordinates are derived dynamically from Open-Meteo's global spatial index or hardware device GPS.
2. **Supabase Coordinate Caching**: When coordinates (`latitude` and `longitude`) already exist in the Supabase `farms` table for an authenticated farmer, they are loaded and reused directly. The application skips redundant external API calls.
3. **Hierarchical Disambiguation**:
   - Rural Indian villages frequently share identical names across different districts or states (e.g. *Khanna* in Punjab vs *Khanna* in Uttar Pradesh, *Bhadson* in Patiala vs *Bhadson* in Karnal).
   - Our geocoding utility cross-matches candidate responses against `admin1` (State) and `admin2` (District) to ensure accurate spatial resolution.
   - If a small agricultural hamlet is unlisted, the algorithm automatically resolves the district administrative center as a graceful fallback and tags the record with `district_fallback`.

---

## 🛠️ Reusable Location Functions (`frontend/lib/location.ts`)

### `geocodeFarmLocation(params: GeocodingParams): Promise<GeocodingSuccess>`
Queries Open-Meteo Geocoding API:
```ts
const result = await geocodeFarmLocation({
  village: "Khanna",
  district: "Ludhiana",
  state: "Punjab",
});
```

**Returned Object**:
```ts
{
  latitude: 30.70547,
  longitude: 76.22196,
  elevation: 269.0,
  resolvedName: "Khanna, Ludhiana district, Punjab",
  admin1: "Punjab",
  admin2: "Ludhiana district",
  country: "India",
  matchLevel: "exact_village",
  source: "open_meteo"
}
```

### `hasValidCoordinates(lat, lon): boolean`
Ensures numbers are valid floats within `-90 <= lat <= 90` and `-180 <= lon <= 180`.

### `formatCoordinates(lat, lon, precision = 4): string`
Returns human-readable representation:
```text
30.7055° N, 76.2220° E
```

---

## 🔄 Error Handling & Farmer Retry Flow

- If Open-Meteo is unreachable or if no spatial match is found:
  - An informative alert card renders in the location section:
    > **Geocoding Resolution Failed**
    > Could not locate coordinates for "X, Y, Z". Please check spelling or enter coordinates manually.
  - A **"Retry Geocoding"** button is provided immediately adjacent to the error, allowing instant re-execution without losing existing form input.
