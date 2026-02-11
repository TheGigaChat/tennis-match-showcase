// Onboarding step order (public paths). Edit this list to add/reorder steps.
export const ONBOARDING_STEPS = [
  "/name",
  "/about",
  "/age",        // new step you mentioned
  "/gender",
  "/tennis-level",
  // "/picklebal-llevel",
  "/profile-photo",
  "/user-preferences",
  "/user-location",
] as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export function stepIndex(path: string) {
  return ONBOARDING_STEPS.indexOf(path as OnboardingStep); // -1 if not in flow
}
