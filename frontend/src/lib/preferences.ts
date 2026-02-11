// src/lib/preferences.ts
import { apiFetch } from "@/lib/cookies";
import { kmToMiles, milesToKm } from "@/lib/units";

/** Backend contract (enums are UPPERCASE) */
export type PreferencesPayload = {
  game: "TENNIS" | "PICKLEBALL";
  partnerGender: "MALE" | "FEMALE" | "ANY";
  sessionType: "MATCH" | "PRIVATE";
  maxDistanceKm: number;
};

const DEFAULT_MAX_DISTANCE_KM = 25;
export const DEFAULT_MAX_DISTANCE_MI = kmToMiles(DEFAULT_MAX_DISTANCE_KM, 0);

/** Lenient DTO parser (tolerates extra/renamed fields) */
function normalize(dto: any): PreferencesPayload | null {
  if (!dto || typeof dto !== "object") return null;

  const game = dto.game ?? dto.sport ?? dto.type ?? null;
  const partnerGender = dto.partnerGender ?? dto.targetGender ?? dto.gender ?? null;
  const sessionType = dto.sessionType ?? dto.typePref ?? dto.session ?? null;
  const maxDistanceKm =
      typeof dto.maxDistanceKm === "number"
          ? dto.maxDistanceKm
          : typeof dto.maxDistance === "number"
              ? dto.maxDistance
              : null;

  if (!game || !partnerGender || !sessionType || maxDistanceKm == null) return null;

  return {
    game: String(game).toUpperCase() === "PICKLEBALL" ? "PICKLEBALL" : "TENNIS",
    partnerGender:
        String(partnerGender).toUpperCase() === "MALE"
            ? "MALE"
            : String(partnerGender).toUpperCase() === "FEMALE"
                ? "FEMALE"
                : "ANY",
    sessionType:
        String(sessionType).toUpperCase() === "PRIVATE" ? "PRIVATE" : "MATCH",
    maxDistanceKm: Number(maxDistanceKm),
  };
}

/** GET current preferences; 204/401/403 → null */
export async function fetchPreferences(): Promise<PreferencesPayload | null> {
  const res = await apiFetch("/profile/preferences", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (res.status === 204 || res.status === 401 || res.status === 403) return null;
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to load preferences");
  }
  const data = await res.json().catch(() => ({}));
  return normalize(data);
}

/** PATCH partial/full save of preferences */
export async function patchPreferences(patch: Partial<PreferencesPayload>): Promise<void> {

  // Drop undefined so we don't overwrite with nulls on the backend
  const body: Record<string, any> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) body[k] = v;
  }

  const res = await apiFetch("/profile/preferences", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok && res.status !== 204) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to save preferences");
  }
}

/** (Optional) DELETE user preferences */
export async function deletePreferences(): Promise<void> {
  const res = await apiFetch("/profile/preferences", {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to delete preferences");
  }
}

/* ================= UI <-> Backend mapping ================= */

/** UI→Backend (lowercase → UPPERCASE) */
export function uiToPayload(input: {
  game: "tennis" | "pickleball";
  gender: "male" | "female" | "any";
  typePref: "match" | "private";
  maxDistance: number;
}): PreferencesPayload {
  const km = milesToKm(Number(input.maxDistance || 1), 0);
  return {
    game: input.game === "pickleball" ? "PICKLEBALL" : "TENNIS",
    partnerGender:
        input.gender === "male" ? "MALE" : input.gender === "female" ? "FEMALE" : "ANY",
    sessionType: input.typePref === "private" ? "PRIVATE" : "MATCH",
    maxDistanceKm: Math.max(1, km),
  };
}

/** Backend→UI (UPPERCASE → lowercase for controls) */
export function payloadToUI(p: PreferencesPayload) {
  return {
    game: p.game === "PICKLEBALL" ? "pickleball" as const : "tennis" as const,
    gender:
        p.partnerGender === "MALE"
            ? ("male" as const)
            : p.partnerGender === "FEMALE"
                ? ("female" as const)
                : ("any" as const),
    typePref: p.sessionType === "PRIVATE" ? ("private" as const) : ("match" as const),
    maxDistance: Math.max(
      1,
      kmToMiles(Number(p.maxDistanceKm ?? DEFAULT_MAX_DISTANCE_KM), 0)
    ),
  };
}
