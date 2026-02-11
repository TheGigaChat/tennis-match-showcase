"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/cookies";
import {
  ONBOARDING_PATHS,
  PUBLIC_PATHS,
  resolveOnboardingPath,
  withRegistrationContinue,
} from "@/lib/onboardingStatus";

type OnboardingStatusResponse = {
  isAuthenticated: boolean;
  steps: {
    name: boolean;
    about: boolean;
    age: boolean;
    gender: boolean;
    tennisLevel: boolean;
    profilePhoto: boolean;
    preferences: boolean;
    location: boolean;
  };
  nextStep: string;
};

export default function OnboardingGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const isChecking = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    if (PUBLIC_PATHS.has(pathname) || ONBOARDING_PATHS.has(pathname)) return;
    if (isChecking.current) return;

    isChecking.current = true;
    (async () => {
      try {
        const res = await apiFetch("/me/onboarding-status", {
          method: "GET",
          useRefreshResponseOn401: true,
        });
        if (res.status === 401) {
          router.replace("/registration");
          return;
        }
        if (!res.ok) {
          router.replace("/registration");
          return;
        }

        const data = (await res.json().catch(() => null)) as OnboardingStatusResponse | null;
        const nextPath = resolveOnboardingPath(data?.nextStep);
        if (nextPath && nextPath !== pathname) {
          router.replace(withRegistrationContinue(nextPath));
        }
      } catch {
        router.replace("/registration");
      } finally {
        isChecking.current = false;
      }
    })();
  }, [pathname, router]);

  return null;
}
