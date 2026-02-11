"use client";

import ContinueButton from "@/components/ContinueButton";
import ChoiceButton from "@/components/ChoiceButton";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/cookies";
import { markOnboardingStepComplete } from "@/lib/onboardingStatus";

/* ========= API placeholders (swap later) =========
   Options for later: REST (/api/profile), tRPC/GraphQL, Server Actions
=================================================== */
type Gender = "MALE" | "FEMALE"

async function fetchProfileGender(): Promise<Gender | null> {
  // Example later:
  // const res = await fetch("/api/profile", { cache: "no-store" });
  // if (!res.ok) throw new Error("Failed to load profile");
  // const data = await res.json();
  // return data.gender ?? null;
  return null; // simulate "no gender yet"
}

async function saveProfileGender(gender: Gender): Promise<void> {
  // Example later:
  const res = await apiFetch("/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ gender }),
  });
  if (!res.ok) throw new Error("Failed to save gender");
  await new Promise((r) => setTimeout(r, 300)); // simulate latency
}

/* ================== Page ================== */
export default function Page() {
  const router = useRouter();

  const [selected, setSelected] = useState<Gender | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // Prefill once from backend
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const g = await fetchProfileGender();
        if (!ignore && g) setSelected(g);
      } catch {
        if (!ignore) setError("Could not load your profile. You can still continue.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const handleContinue = async () => {
    setError("");
    if (!selected) {
      setError("Please choose your gender.");
      return;
    }
    try {
      setIsSaving(true);
      await saveProfileGender(selected as Gender);
      await markOnboardingStepComplete("gender");
      router.push("/tennis-level");
    } catch {
      setError("We couldn't save your choice. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <main className="mt-6">
        <h1 className="text-center text-h1 font-semibold text-textMain">I am a</h1>
        <p className="mt-2 text-center text-h4 text-neutral">Please select your gender.</p>

        <div className="mt-8 flex flex-col gap-4">
          <ChoiceButton
            label="MALE"
            isActive={selected === "MALE"}
            onClick={() => setSelected("MALE")}
          />
          <ChoiceButton
            label="FEMALE"
            isActive={selected === "FEMALE"}
            onClick={() => setSelected("FEMALE")}
          />
          {/* Later: add "Other" here */}
        </div>

        {error && (
          <p className="mt-3 text-center text-h5 text-red-600" role="alert">
            {error}
          </p>
        )}
      </main>

      <footer className="mt-auto pt-4 pb-[env(safe-area-inset-bottom)]">
        <ContinueButton
          label={isSaving ? "Saving…" : "Continue"}
          onClick={handleContinue}
          disabled={!selected || isSaving || isLoading}
        />
      </footer>
    </>
  );
}

