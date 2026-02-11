"use client";

import { usePathname } from "next/navigation";
import CompletionBar from "./CompletionBar";
import { ONBOARDING_STEPS, stepIndex } from "@/lib/onboarding";

/** Reads the current path and renders a segmented CompletionBar */
export default function OnboardingProgress({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const idx = stepIndex(pathname);
  if (idx === -1) return null;

  return (
    <CompletionBar
      total={ONBOARDING_STEPS.length}
      current={idx + 1}
      className={className}
      aria-label="Onboarding progress"
    />
  );
}
