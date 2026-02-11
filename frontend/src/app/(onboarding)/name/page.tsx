"use client";

import ContinueButton from "@/components/ContinueButton";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch, API } from "@/lib/cookies";
import { markOnboardingStepComplete } from "@/lib/onboardingStatus"; // direct /csrf API and apiFetch for other calls

const DRAFT_KEY = "onboarding:firstName";

// Unicode letters + combining marks; allow space, dot, apostrophe, hyphen; max 50
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,49}$/u;

function normalizeName(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function validateFirstNameClient(s: string) {
  const n = normalizeName(s);
  return n.length >= 1 && n.length <= 50 && NAME_RE.test(n);
}

async function saveFirstName(name: string) {
  const res = await apiFetch("/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
        (() => {
          try {
            return JSON.parse(text).message;
          } catch {
            return text || "Failed to save name";
          }
        })()
    );
  }
}

// Minimal check: if the user already has a profile, skip this page
async function hasExistingProfile(): Promise<boolean> {
  try {
    const res = await apiFetch("/profile", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return false; // 401/403/etc → treat as no profile yet
    const data = await res.json();
    return Boolean(data?.firstName);
  } catch {
    return false;
  }
}

export default function Page() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [isChecking, setIsChecking] = useState(true); // checking if user must skip page
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string>("");

  // 1) Warm up CSRF cookie on entry
  // 2) Load local draft
  // 3) Check if profile already exists (then skip this step)
  useEffect(() => {
    // (1) Background CSRF warm-up — simple GET without headers
    fetch(`${API}/csrf`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }).catch(() => {});

    // (2) Restore draft from localStorage
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) setFirstName(draft);
    } catch {
      // ignore
    }

    // (3) If profile exists — leave this page
    (async () => {
      const exists = await hasExistingProfile();
      if (exists) {
        router.replace("/"); // change to the desired post-login/onboarding route
        return;
      }
      setIsChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft
  useEffect(() => {
    try {
      const clean = normalizeName(firstName);
      if (clean) {
        localStorage.setItem(DRAFT_KEY, clean);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // ignore
    }
  }, [firstName]);

  const isValidName = useMemo(() => validateFirstNameClient(firstName), [firstName]);
  const showNameError = firstName.length > 0 && !isValidName;

  const canSubmit = useMemo(
      () => isValidName && !isSaving && !isChecking,
      [isValidName, isSaving, isChecking]
  );

  const handleContinue = async () => {
    setServerError("");
    const clean = normalizeName(firstName);

    if (!validateFirstNameClient(clean)) {
      // Local validation — do not hit the server
      return;
    }

    try {
      setIsSaving(true);
      const res = await apiFetch("/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        throw new Error(
          (() => {
            try {
              return JSON.parse(bodyText).message;
            } catch {
              return bodyText || "Failed to save name";
            }
          })()
        );
      }

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }

      await markOnboardingStepComplete("name");
      router.push("/about"); // next onboarding step
    } catch (e: any) {
      setServerError(e?.message || "We couldn't save your name. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <>
        <main className="mt-6">
          <h1 className="text-center text-h1 font-semibold text-textMain">My name is</h1>

          <label htmlFor="firstName" className="sr-only">
            First name
          </label>
          <input
              id="firstName"
              type="text"
              placeholder={isChecking ? "Loading..." : "Enter first name"}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isSaving || isChecking}
              className={[
                "mt-6 w-full border-b outline-none bg-transparent text-h4 text-textMain placeholder:text-neutral",
                showNameError ? "border-red-500" : "border-neutral",
              ].join(" ")}
              aria-invalid={showNameError || !!serverError}
              aria-describedby={
                showNameError
                    ? "firstName-format-error"
                    : serverError
                        ? "firstName-server-error"
                        : undefined
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) handleContinue();
              }}
              inputMode="text"
              autoComplete="given-name"
          />

          {showNameError && (
              <p id="firstName-format-error" role="alert" className="mt-2 text-h5 text-red-600">
                Use letters (any language), spaces, dot, apostrophe, or hyphen. Max 50 characters.
              </p>
          )}

          {serverError && (
              <p id="firstName-server-error" role="alert" className="mt-2 text-h5 text-red-600">
                {serverError}
              </p>
          )}

          <p className="mt-3 text-h4 text-neutral">This is how it will appear in TennisMatch.</p>
        </main>

        <footer className="mt-auto pt-4 pb-[env(safe-area-inset-bottom)]">
          <ContinueButton
              label={isSaving ? "Saving…" : "Continue"}
              onClick={handleContinue}
              disabled={!canSubmit}
          />
        </footer>
      </>
  );
}


