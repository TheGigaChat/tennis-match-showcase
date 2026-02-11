"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/cookies";
import { resolveOnboardingPath, withRegistrationContinue } from "@/lib/onboardingStatus";

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

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await apiFetch("/me/onboarding-status", {
        method: "GET",
        useRefreshResponseOn401: true,
      });
      if (res.status === 401) {
        router.replace("/registration");
        return;
      }
      if (!res.ok) {
        router.replace("/profile");
        return;
      }
      const data = (await res.json().catch(() => null)) as OnboardingStatusResponse | null;
      const nextPath = resolveOnboardingPath(data?.nextStep);
      router.replace(nextPath ? withRegistrationContinue(nextPath) : "/profile");
    })();
  }, [router]);

  return (
    <div className="min-h-dvh grid place-items-center bg-bg text-textMain">
      <p className="text-h4">Loading…</p>
    </div>
  );
}
