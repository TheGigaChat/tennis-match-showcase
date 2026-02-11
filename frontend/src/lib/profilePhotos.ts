// Placeholder CDN URLs for public showcase; replace with your own assets.
export const DEFAULT_WOMAN_PHOTO_URL = "https://cdn.your-service.example.com/placeholder-woman.png";
export const DEFAULT_MAN_PHOTO_URL = "https://cdn.your-service.example.com/placeholder-man.png";

export type ProfileGender = "MALE" | "FEMALE";

export function getDefaultPhotoUrl(gender?: ProfileGender | string | null): string {
  const raw = typeof gender === "string" ? gender.toUpperCase() : "";
  return raw == "FEMALE" ? DEFAULT_WOMAN_PHOTO_URL : DEFAULT_MAN_PHOTO_URL;
}
