// lib/locationApi.ts
import { apiFetch } from "@/lib/cookies";
import type { GeoFix } from "./geo";

export type LocationRow = {
  latitude: number;
  longitude: number;
  accuracy_m: number;
  updated_at: string; // ISO
  place_name?: string;
};

export const REFRESH_TIME = 60 * 60 * 1000;

export async function getLocationRow(): Promise<LocationRow | null> {
  try {
    const res = await apiFetch("/profile/user-location", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as LocationRow;
  } catch {
    return null;
  }
}

export async function upsertLocation(
  fix: GeoFix & { place_name?: string },
  hasExisting: boolean
): Promise<void> {
  const method = hasExisting ? "PATCH" : "POST";
  const res = await apiFetch("/profile/user-location", {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(fix),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "Failed to save location");
  }
}

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  placeName?: string;
};

export async function geocodeLocation(query: string): Promise<GeocodeResult> {
  const res = await apiFetch("/profile/user-location/geocode", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 404) {
      throw new Error("We couldn't find this location. Try adding a city or country.");
    }
    if (res.status === 429) {
      throw new Error("Too many attempts. Please try again later.");
    }
    throw new Error(text || "Failed to geocode location");
  }

  return (await res.json()) as GeocodeResult;
}

export function isStale(row: LocationRow | null) {
  if (!row?.updated_at) return true;
  const age = Date.now() - new Date(row.updated_at).getTime();
  return age >= REFRESH_TIME;
}
