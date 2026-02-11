"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SmallChoiceButton from "@/components/SmallChoiceButton";
import ContinueButton from "@/components/ContinueButton";
import InputSlider from "@/components/InputSlider";
import {
  fetchPreferences,
  patchPreferences,
  uiToPayload,
  payloadToUI,
  DEFAULT_MAX_DISTANCE_MI,
} from "@/lib/preferences";
import { markOnboardingStepComplete } from "@/lib/onboardingStatus";

const locationIconDataURL =
  'data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 20 20" fill="%230E5628" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>';

type Game = "tennis" | "pickleball";
type Gender = "male" | "female" | "any";
type TypePref = "match" | "private";
type Mode = "settings" | "onboarding";

type UserPreferencesPageProps = {
  mode: Mode;
};

export default function UserPreferencesPage({ mode }: UserPreferencesPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = searchParams.get("page");

  const [game, setGame] = useState<Game | null>(
    mode === "onboarding" ? "tennis" : null
  );
  const [gender, setGender] = useState<Gender | null>(
    mode === "onboarding" ? "any" : null
  );
  const [typePref, setTypePref] = useState<TypePref | null>(
    mode === "onboarding" ? "match" : null
  );
  const [maxDistance, setMaxDistance] = useState<number>(DEFAULT_MAX_DISTANCE_MI);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!game && !!gender && !!typePref && maxDistance >= 1;

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const existing = await fetchPreferences(); // 204/401/403 => null
        if (!ignore && existing) {
          const ui = payloadToUI(existing);
          setGame(ui.game);
          setGender(ui.gender);
          setTypePref(ui.typePref);
          setMaxDistance(ui.maxDistance);
        }
      } catch (e: any) {
        if (!ignore) {
          setError(
            e?.message || "Could not load preferences. You can still continue."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleApply = async () => {
    setError(null);

    if (!canSubmit) {
      setError("Please choose game, gender and type.");
      return;
    }

    setSaving(true);
    try {
      // UI -> Backend payload
      await patchPreferences(
        uiToPayload({
          game: game!,
          gender: gender!,
          typePref: typePref!,
          maxDistance,
        })
      );

      if (mode === "settings") {
        router.push(`/${page === "discover" ? "discover" : "profile"}`);
      } else {
        await markOnboardingStepComplete("preferences");
        router.push("/user-location");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <>
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-green-900">Your preferences</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your preferences shape the partners we match you with.
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 space-y-8 pb-32">
        {/* Game */}
        <section aria-labelledby="game-title" className="space-y-3">
          <div className="flex items-center gap-2">
            <Image src="/game-icon.svg" width={22} height={22} alt="" />
            <h2 id="game-title" className="text-xl font-semibold text-green-900">
              Game
            </h2>
          </div>

          <div
            role="radiogroup"
            aria-labelledby="game-title"
            className="grid grid-cols-2 gap-4"
          >
            <SmallChoiceButton
              label="Tennis"
              selected={game === "tennis"}
              onClick={() => setGame("tennis")}
            />
            <SmallChoiceButton
              label="Pickleball"
              selected={game === "pickleball"}
              disabled
              onClick={() => setGame("pickleball")}
            />
          </div>

          <hr className="border-t border-neutral-300/70 mt-5" />
        </section>

        {/* Gender */}
        <section aria-labelledby="gender-title" className="space-y-3">
          <div className="flex items-center gap-2">
            <Image src="/gender-icon.svg" width={22} height={22} alt="" />
            <h2 id="gender-title" className="text-xl font-semibold text-green-900">
              Gender
            </h2>
          </div>

          <div
            role="radiogroup"
            aria-labelledby="gender-title"
            className="grid grid-cols-2 gap-4"
          >
            <SmallChoiceButton
              label="Male"
              selected={gender === "male"}
              onClick={() => setGender("male")}
            />
            <SmallChoiceButton
              label="Female"
              selected={gender === "female"}
              onClick={() => setGender("female")}
            />
            <SmallChoiceButton
              label="Any"
              className="col-span-2"
              selected={gender === "any"}
              onClick={() => setGender("any")}
            />
          </div>

          <hr className="border-t border-neutral-300/70 mt-5" />
        </section>

        {/* Type */}
        <section aria-labelledby="type-title" className="space-y-3">
          <div className="flex items-center gap-2">
            <Image src="/cup-icon.svg" width={22} height={22} alt="" />
            <h2 id="type-title" className="text-xl font-semibold text-green-900">
              Type
            </h2>
          </div>

          <div
            role="radiogroup"
            aria-labelledby="type-title"
            className="grid grid-cols-2 gap-4"
          >
            <SmallChoiceButton
              label="Match"
              selected={typePref === "match"}
              onClick={() => setTypePref("match")}
            />
            <SmallChoiceButton
              label="Private Lesson"
              selected={typePref === "private"}
              disabled
              onClick={() => setTypePref("private")}
            />
          </div>

          <hr className="border-t border-neutral-300/70 mt-5" />
        </section>

        {/* Max Distance (slider) */}
        <InputSlider
          icon={<Image src={locationIconDataURL} width={22} height={22} alt="" />}
          title="Max Distance (miles)"
          min={1}
          maxNumber={50}
          value={maxDistance}
          onChange={setMaxDistance}
          step={1}
        />
      </main>

      {/* Footer */}
      <footer className="fixed inset-x-0 bottom-8 px-6">
        <div className="mx-auto w-full max-w-phone">
          <ContinueButton
            label={saving ? "Saving..." : "Apply Filters"}
            onClick={handleApply}
            disabled={!canSubmit || saving || loading}
          />
        </div>
      </footer>
    </>
  );

  if (mode === "onboarding") {
    return content;
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto w-full max-w-phone px-6 py-8 min-h-dvh flex flex-col">
        {content}
      </div>
    </div>
  );
}
