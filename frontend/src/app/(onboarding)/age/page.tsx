"use client";

// src/app/(onboarding)/age/page.tsx
import ContinueButton from "@/components/ContinueButton";
import BirthdateInput from "@/components/BirthdayInput";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/cookies"; // <-- use the shared wrapper
import { markOnboardingStepComplete } from "@/lib/onboardingStatus";



/* ===========  API placeholders (swap later)  ===========
   You can implement with:
   - REST: GET/PUT /api/profile
   - tRPC / GraphQL
   - Server Actions
======================================================== */
type BirthdateISO = string; // "YYYY-MM-DD"
const MIN_AGE = 18;

async function fetchProfileBirthdate(): Promise<BirthdateISO | null> {
  // Example later:
  // const res = await fetch("/api/profile", { cache: "no-store" });
  // if (!res.ok) throw new Error("Failed to load profile");
  // const data = await res.json();
  // return data.birthdate ?? null;
  return null; // simulate "no birthdate yet"
}


async function saveBirthdate(isoDate: string): Promise<void> {
    const age = ageFromISO(isoDate);

    if (age < MIN_AGE) {
        throw new Error("You must be at least 18 years old to use TennisMatch.");
    }

    const res = await apiFetch("/profile", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",

        },
        body: JSON.stringify({ age }),
    });

    if (!res.ok) throw new Error("Failed to save age");
    await new Promise((r) => setTimeout(r, 300));
}

/* ===========  Helpers  =========== */
function clamp2(n: number) {
  return String(n).padStart(2, "0").slice(-2);
}
function validIso(y: string, m: string, d: string): BirthdateISO | null {
  if (y.length !== 4 || m.length !== 2 || d.length !== 2) return null;
  const year = Number(y), month = Number(m), day = Number(d);
  if (!year || !month || !day) return null;
  if (year < 1900) return null;

  // Month range (01..12) and max day in month (leap-year aware)
  if (month < 1 || month > 12) return null;
  const lastDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > lastDay) return null;

  // No future dates
  const dt = new Date(`${y}-${clamp2(month)}-${clamp2(day)}T00:00:00Z`);
  const today = new Date();
  if (dt.getTime() > today.getTime()) return null;

  return `${y}-${clamp2(month)}-${clamp2(day)}`;
}

function ageFromISO(iso: string): number {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) throw new Error("Invalid ISO birthdate");

    // Use UTC components to avoid timezone rollover around midnight
    const today = new Date();
    const ty = today.getUTCFullYear();
    const tm = today.getUTCMonth() + 1; // 1..12
    const td = today.getUTCDate();

    let age = ty - y;
    if (tm < m || (tm === m && td < d)) age--;

    return age;
}

/** Grabs the first input inside OtpInput to move focus programmatically. */
function focusFirstInput(container: HTMLDivElement | null) {
  const el = container?.querySelector("input") as HTMLInputElement | null;
  if (el) {
    el.focus();
    el.select?.();
  }
}

export default function Page() {
  const router = useRouter();
  const [initialISO, setInitialISO] = useState<string | null>(null);
  const [iso, setIso] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasFullInput, setHasFullInput] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const val = await fetchProfileBirthdate();
        setInitialISO(val);
      } catch {
        setError("Could not load your profile. You can still continue.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const invalidBirthdateMessage = "Your birth date doesn't look right. Check the date and try again.";
  const tooYoungMessage = "You must be at least 18 years old to use TennisMatch.";
  const isUnderage = iso ? ageFromISO(iso) < MIN_AGE : false;

  const handleContinue = async () => {
    if (!iso) {
      setError(hasFullInput ? invalidBirthdateMessage : "Enter your birth date (YYYY / MM / DD).");
      return;
    }
    const age = ageFromISO(iso);
    if (age < MIN_AGE) {
      setError(tooYoungMessage);
      return;
    }
    try {
      setIsSaving(true);
      await saveBirthdate(iso);
      await markOnboardingStepComplete("age");
      router.push("/gender"); // next step
    } catch {
      setError("We couldn’t save your date of birth. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <main className="mt-6">
        <h1 className="text-center text-h1 font-semibold text-textMain">My age is</h1>

        <BirthdateInput
          initialISO={initialISO}
          error={!!error}
          resetKey={resetKey}
          onChange={({ year, month, day, iso }) => {
            const full = year.length === 4 && month.length === 2 && day.length === 2;
            setIso(iso);
            setHasFullInput(full);
            if (full && !iso) {
              setError(invalidBirthdateMessage);
            } else if (full && iso) {
              const age = ageFromISO(iso);
              if (age < MIN_AGE) {
                setError(tooYoungMessage);
              } else if (error) {
                setError("");
              }
            } else if (error) {
              setError("");
            }
          }}
          onComplete={(goodIso) => setIso(goodIso)}
        />

        {error && (
          <p className="mt-3 text-center text-h5 text-red-600" role="alert">{error}</p>
        )}
        <p className="mt-3 text-h4 text-neutral text-center">Your age will be public.</p>
      </main>

      <footer className="mt-auto pt-4 pb-[env(safe-area-inset-bottom)]">
        <ContinueButton
          label={isSaving ? "Saving…" : "Continue"}
          onClick={handleContinue}
          disabled={!iso || isUnderage || isLoading || isSaving}
        />
      </footer>
    </>
  );
}

