"use client";

import ContinueButton from "@/components/ContinueButton";
import ChoiceButton from "@/components/ChoiceButton";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LEVELS,
    LEVEL_LABEL,
    isBackendLevel,
    type BackendSkillLevel,
} from "@/lib/skillLevels";
import { apiFetch } from "@/lib/cookies";
import { markOnboardingStepComplete } from "@/lib/onboardingStatus";

/* ====== API ====== */
async function fetchProfileTennisLevel(): Promise<BackendSkillLevel | null> {
    const res = await apiFetch("/profile", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
    });
    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    const raw = data?.skillLevel;
    const normalized = typeof raw === "string" ? raw.toUpperCase() : null;
    return isBackendLevel(normalized) ? normalized : null;
}

async function saveProfileTennisLevel(level: BackendSkillLevel): Promise<void> {
    const res = await apiFetch("/profile", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ skillLevel: level }), // field name matches backend
    });

    if (!res.ok) {
        // Helps diagnose why it didn't save
        const txt = await res.text().catch(() => "");
        throw new Error(`Failed to save tennis level: ${res.status} ${txt}`);
    }
    await new Promise((r) => setTimeout(r, 300)); // simulate latency
}

/* ============== Page ============== */
export default function Page() {
    const router = useRouter();

    const [selected, setSelected] = useState<BackendSkillLevel | "">("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    // Prefill from backend
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const lvl = await fetchProfileTennisLevel();
                if (!ignore && lvl) setSelected(lvl);
            } catch {
                if (!ignore)
                    setError("Could not load your profile. You can still continue.");
            } finally {
                if (!ignore) setIsLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, []);

    const handleContinue = async () => {
        setError("");
        if (!selected) {
            setError("Please choose your tennis level.");
            return;
        }
        try {
            setIsSaving(true);
            await saveProfileTennisLevel(selected as BackendSkillLevel);
            await markOnboardingStepComplete("tennisLevel");
            router.push("/profile-photo");
        } catch (e: any) {
            setError(e?.message ?? "We couldn't save your choice. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <main className="mt-6">
                <h1 className="text-center text-h1 font-semibold text-textMain">
                    My Tennis level
                </h1>
                <p className="mt-2 text-center text-h4 text-neutral">
                    Please select your Tennis level.
                </p>

                <div className="mt-8 flex flex-col gap-4">
                    {LEVELS.map((lvl) => (
                        <ChoiceButton
                            key={lvl}
                            label={LEVEL_LABEL[lvl]}
                            isActive={selected === lvl}
                            onClick={() => setSelected(lvl)}
                        />
                    ))}
                </div>

                <a
                    href="/tennis-level-comparison"
                    className="mt-6 block text-center text-h4 text-main underline underline-offset-2 hover:opacity-80"
                >
                    If you are not sure, click here.
                </a>

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
                    disabled={!selected || isLoading || isSaving}
                />
            </footer>
        </>
    );
}


