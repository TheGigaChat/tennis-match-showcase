import { apiFetch } from "@/lib/cookies";

export type OnboardingNextStep =
  | "name"
  | "about"
  | "age"
  | "gender"
  | "tennisLevel"
  | "profilePhoto"
  | "preferences"
  | "location"
  | "complete";

export const ONBOARDING_PATHS = new Set([
  "/name",
  "/about",
  "/age",
  "/gender",
  "/tennis-level",
  "/profile-photo",
  "/user-preferences",
  "/user-location",
]);

export const PUBLIC_PATHS = new Set([
  "/",
  "/registration",
  "/verify",
  "/terms",
  "/policy",
  "/tennis-level-comparison",
]);

export function resolveOnboardingPath(nextStep: string | null | undefined): string | null {
  switch (nextStep) {
    case "name":
      return "/name";
    case "about":
      return "/about";
    case "age":
      return "/age";
    case "gender":
      return "/gender";
    case "tennisLevel":
      return "/tennis-level";
    case "profilePhoto":
      return "/profile-photo";
    case "preferences":
      return "/user-preferences";
    case "location":
      return "/user-location";
    default:
      return null;
  }
}

export function withRegistrationContinue(path: string): string {
  if (!path) return path;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}registrationContinue=true`;
}

export async function markOnboardingStepComplete(step: string): Promise<void> {
  if (!step) return;
  const res = await apiFetch("/me/onboarding-status/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to update onboarding status");
  }
}
