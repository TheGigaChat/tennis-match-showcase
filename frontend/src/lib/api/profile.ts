import { LEVEL_LABEL, isBackendLevel, BackendSkillLevel, toSkillLabel } from "@/lib/skillLevels";
import { apiFetch } from "@/lib/cookies";
import { getDefaultPhotoUrl } from "@/lib/profilePhotos";

let fetchMyProfileInFlight: Promise<MeProfile | null> | null = null;
let getMyProfileInFlight: Promise<MeProfile> | null = null;

function hasMePayload(data: any): boolean {
  return Boolean(data && typeof data === "object" && ("id" in data || "name" in data));
}

export type MeProfile = {
  id: string;
  name: string;
  age: number;
  skillLevel: string;
  bio: string;
  photo: string;
};

export type PhotoDto = {
  id: number;
  url: string;
};

export async function fetchMyProfile(): Promise<MeProfile | null> {
  if (fetchMyProfileInFlight) {
    return fetchMyProfileInFlight;
  }

  fetchMyProfileInFlight = (async () => {
    try {
      const res = await apiFetch("/profile/me", {
        method: "GET",
        useRefreshResponseOn401: true,
      });

      if (!res.ok) return null;

      let data = (await res.json().catch(() => null)) as any;
      if (!hasMePayload(data)) {
        const fallbackRes = await apiFetch("/profile/me", {
          method: "GET",
          skipAuthRefresh: true,
        });
        if (!fallbackRes.ok) return null;
        data = (await fallbackRes.json().catch(() => null)) as any;
        if (!hasMePayload(data)) return null;
      }

      const id = typeof data.id === "string" ? data.id : "me";
      const name = typeof data.name === "string" ? data.name : "Me";
      const age = Number.isFinite(data.age) ? (data.age as number) : 18;

      // skillLevel must be one of our known levels
      const skillLevel = toSkillLabel(data.skillLevel);

      const bio = typeof data.bio === "string" ? data.bio : "No bio.";
      const photo =
          typeof data.photo === "string" && data.photo.length > 0
            ? data.photo
            : getDefaultPhotoUrl(data.gender);
      return { id, name, age, skillLevel, bio, photo };

    } catch {
      return null;
    } finally {
      fetchMyProfileInFlight = null;
    }
  })();

  return fetchMyProfileInFlight;
}

/** GET /profile/me */
export async function getMyProfile(signal?: AbortSignal): Promise<MeProfile> {
  if (getMyProfileInFlight) {
    return getMyProfileInFlight;
  }

  getMyProfileInFlight = (async () => {
    const res = await apiFetch("/profile/me", {
      method: "GET",
      signal,
      useRefreshResponseOn401: true,
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch profile: ${res.status}`);
    }

    let data = await res.json().catch(() => null);
    if (!hasMePayload(data)) {
      const fallbackRes = await apiFetch("/profile/me", {
        method: "GET",
        skipAuthRefresh: true,
      });
      if (!fallbackRes.ok) {
        throw new Error(`Failed to fetch profile: ${fallbackRes.status}`);
      }
      data = await fallbackRes.json().catch(() => null);
      if (!hasMePayload(data)) {
        throw new Error("Failed to fetch profile: invalid payload");
      }
    }

    // Convert backend enum to frontend label
      const skillLevel = toSkillLabel(data.skillLevel);

    // Map backend response to frontend type
    return {
      id: data.id ?? "me",
      name: data.name ?? "",
      age: data.age ?? 18,
      skillLevel,
      bio: data.bio ?? "",
      photo: data.photo ?? getDefaultPhotoUrl(data.gender),
    };
  })();

  try {
    return await getMyProfileInFlight;
  } finally {
    getMyProfileInFlight = null;
  }
}

/** Convert frontend label back to backend enum */
function labelToBackendLevel(label: string): BackendSkillLevel {
  // Find the enum key that matches this label
  const entry = Object.entries(LEVEL_LABEL).find(([_, val]) => val === label);
  return entry ? (entry[0] as BackendSkillLevel) : "BEGINNER";
}

/** PATCH /profile - updates profile and returns updated data */
export async function updateMyProfile(
  payload: Partial<MeProfile>,
  signal?: AbortSignal
): Promise<MeProfile> {
  // Map frontend fields to backend DTO
  // Backend expects "description" not "bio"
  const dto: Record<string, any> = {};
  if (payload.name !== undefined) dto.name = payload.name;
  if (payload.age !== undefined) dto.age = payload.age;
  if (payload.skillLevel !== undefined) {
    // Convert frontend label to backend enum
    dto.skillLevel = labelToBackendLevel(payload.skillLevel);
  }
  if (payload.bio !== undefined) dto.description = payload.bio;

  const res = await apiFetch("/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to update profile: ${res.status}`);
  }

  // Backend now returns 200 OK with updated profile data
  const data = await res.json();

  // Convert backend enum to frontend label
  const skillLevel = toSkillLabel(data.skillLevel);

  return {
    id: data.id ?? "me",
    name: data.name ?? "",
    age: data.age ?? 18,
    skillLevel,
    bio: data.bio ?? "",
    photo: data.photo ?? getDefaultPhotoUrl(data.gender),
  };
}

/** POST /profile/photo - upload or replace profile photo */
export async function uploadProfilePhoto(
  file: File,
  signal?: AbortSignal
): Promise<PhotoDto> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch("/profile/photo", {
    method: "POST",
    body: formData,
    signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload photo: ${res.status}`);
  }

  return res.json();
}
