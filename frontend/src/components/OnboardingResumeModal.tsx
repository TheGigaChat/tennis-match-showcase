"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { apiFetch } from "@/lib/cookies";

const CONTINUE_PARAM = "registrationContinue";

function buildPath(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function OnboardingResumeModal() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const shouldOpen = searchParams.get(CONTINUE_PARAM) === "true";
  const [open, setOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setOpen(shouldOpen);
  }, [shouldOpen]);

  const clearParam = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(CONTINUE_PARAM);
    router.replace(buildPath(pathname, params));
  };

  const handleContinue = () => {
    setError("");
    setOpen(false);
    clearParam();
  };

  const handleStartOver = async () => {
    setError("");
    setIsBusy(true);
    try {
      const res = await apiFetch("/me/onboarding-status/reset", {
        method: "POST",
      });
      if (res.status === 401) {
        router.replace("/registration");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || "We couldn’t restart your registration. Try again.");
        return;
      }
      try {
        localStorage.removeItem("onboarding:firstName");
        localStorage.removeItem("onboarding:bio");
      } catch {
        // ignore
      }
      setOpen(false);
      router.replace("/name");
    } finally {
      setIsBusy(false);
    }
  };

  const description = useMemo(
    () => (
      <div className="space-y-2">
        <p>Your registration hasn’t been completed yet.</p>
        <p>Do you want to continue where you left off, or start over?</p>
        {error && <p className="text-red-600">{error}</p>}
      </div>
    ),
    [error]
  );

  return (
    <ConfirmModal
      open={open}
      title="Registration incomplete"
      description={description}
      confirmLabel="Continue"
      cancelLabel="Start over"
      onConfirm={handleContinue}
      onCancel={handleStartOver}
      isBusy={isBusy}
    />
  );
}
