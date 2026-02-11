"use client";

// src/app/(onboarding)/about/page.tsx
import ContinueButton from "@/components/ContinueButton";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/cookies";
import { markOnboardingStepComplete } from "@/lib/onboardingStatus";

const DRAFT_KEY = "onboarding:bio";
const MAX = 100;
const NEXT_ROUTE = "/age";
const DEFAULT_BIO = "A passionate tennis lover...";

// keep simple: trim edges and collapse internal whitespace lines
function normalizeBio(s: string) {
  // collapse more than one space, keep newlines intact
  const collapsedSpaces = s.replace(/[ \t]+/g, " ");
  return collapsedSpaces.trim();
}

function validateBioClient(s: string) {
  const n = normalizeBio(s);
  const len = n.length;
  return len <= MAX;
}

async function saveBio(bio: string) {
  const res = await apiFetch("/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: bio }),
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const text = await res.text();
    throw new Error((() => { try { return JSON.parse(text).message } catch { return text || "Failed to save bio"; } })());
  }
}

async function fetchDefaultBio(): Promise<string> {
  try {
    const res = await apiFetch("/profile/me", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return DEFAULT_BIO;
    const data = await res.json();
    const raw = typeof data?.bio === "string" ? data.bio : "";
    return normalizeBio(raw) || DEFAULT_BIO;
  } catch {
    return DEFAULT_BIO;
  }
}

async function hasExistingBio(): Promise<boolean> {
  try {
    const res = await apiFetch("/profile", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.bio);
  } catch {
    return false;
  }
}

export default function Page() {
  const router = useRouter();

  const [bio, setBio] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string>("");

  // autosize textarea
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const autoSize = (includePlaceholder = false) => {
    const el = taRef.current;
    if (!el) return;

    el.style.height = "auto";
    let height = el.scrollHeight;

    // If the textarea is empty, the placeholder may wrap to multiple lines.
    // Measure it and use the larger height so there is no scrollbar/flicker.
    if (includePlaceholder || !el.value) {
      const saved = el.value;
      const ph = el.placeholder ?? "";
      if (ph) {
        el.value = ph;
        height = Math.max(height, el.scrollHeight);
        el.value = saved;
      }
    }

    el.style.height = `${height}px`;
  };

  // Load draft + optional skip
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) setBio(draft);
    } catch {}

    (async () => {
      const exists = await hasExistingBio();
      if (exists) {
        router.replace("/"); // user already has bio → skip
        return;
      }
      setIsChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draft autosave
  useEffect(() => {
    try {
      const clean = normalizeBio(bio);
      if (clean) localStorage.setItem(DRAFT_KEY, clean);
      else localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, [bio]);

  // Resize on mount/value change
  useEffect(() => {
    autoSize();
  }, [bio]);

  
  useEffect(() => {
    if (!isChecking) autoSize(true); // grow for the placeholder once loading ends
  }, [isChecking]);

  useEffect(() => {
    const onResize = () => autoSize(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const clean = useMemo(() => normalizeBio(bio), [bio]);
  const remaining = MAX - clean.length;
  const isValid = useMemo(() => validateBioClient(bio), [bio]);
  const canSubmit = useMemo(
    () => isValid && !isSaving && !isChecking,
    [isValid, isSaving, isChecking]
  );

  const handleContinue = async () => {
    setServerError("");
    const n = normalizeBio(bio);
    if (!validateBioClient(n)) return;

    try {
      setIsSaving(true);
      const finalBio = n || (await fetchDefaultBio());
      await saveBio(finalBio);

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}

      await markOnboardingStepComplete("about");
      router.push(NEXT_ROUTE);
    } catch (e: any) {
      setServerError(e?.message || "We couldn't save your bio. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <main className="mt-6">
        {/* Title */}
        <h1 className="text-center text-h1 font-semibold text-textMain">My short description</h1>

        {/* Bio input */}
        <label htmlFor="about" className="sr-only">
          About me
        </label>
        <textarea
          id="about"
          ref={taRef}
          placeholder={isChecking ? "Loading..." : DEFAULT_BIO}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          onInput={() => autoSize}
          disabled={isSaving || isChecking}
          rows={1}
          // underline is part of the textarea; as it grows, the line shifts down naturally
          className={[
            "mt-6 w-full border-b outline-none bg-transparent text-h4 text-textMain placeholder:text-neutral",
            "border-neutral resize-none leading-[1.4] overflow-hidden",
          ].join(" ")}
          aria-invalid={!isValid || !!serverError}
          aria-describedby={!isValid ? "bio-format-error" : serverError ? "bio-server-error" : "bio-remaining"}
          inputMode="text"
          spellCheck
        />

        {/* Remaining counter */}
        <p
          id="bio-remaining"
          className={[
            "mt-3 text-h4",
            remaining < 0 ? "text-red-600" : "text-neutral",
          ].join(" ")}
        >
          {remaining >= 0 ? `Remains ${remaining} symbols` : `${-remaining} over limit`}
        </p>

        {/* Client-side error (empty or too long) */}
        {!isValid && bio.length > 0 && (
          <p id="bio-format-error" role="alert" className="mt-2 text-h5 text-red-600">
            Keep it between 1 and {MAX} characters.
          </p>
        )}

        {/* Server error */}
        {serverError && (
          <p id="bio-server-error" role="alert" className="mt-2 text-h5 text-red-600">
            {serverError}
          </p>
        )}
      </main>

      {/* Footer */}
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

