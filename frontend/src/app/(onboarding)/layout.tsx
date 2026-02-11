// src/app/(onboarding)/layout.tsx
import type { ReactNode } from "react";
import { Suspense } from "react";
import OnboardingProgress from "@/components/OnboardingProgress";
import OnboardingResumeModal from "@/components/OnboardingResumeModal";

/**
 * Wraps ONLY the routes inside (onboarding).
 * Global app layout (src/app/layout.tsx) still provides fonts/globals.
 * Pattern: top = progress + content; bottom = page's footer (with mt-auto).
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto w-full max-w-phone px-6 py-8 min-h-dvh flex flex-col">
        <Suspense fallback={null}>
          <OnboardingResumeModal />
        </Suspense>
        {/* Top: progress bar */}
        <OnboardingProgress className="mb-4" />

        {/* Middle+Bottom: page injects its own <main> and <footer>.
           The wrapper grows to fill the screen, so a page footer with `mt-auto`
           will sit at the bottom. */}
        <div className="flex flex-col grow">
          {children}
        </div>
      </div>
    </div>
  );
}
