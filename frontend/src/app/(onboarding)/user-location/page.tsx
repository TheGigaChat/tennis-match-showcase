"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CircleMediumButton from "@/components/CircleMediumButton";
import ContinueButton from "@/components/ContinueButton";
import ManualLocationModal from "@/components/ManualLocationModal";

import { getPositionOnce, getGeoPermissionState, getPermissionInstructions } from "@/lib/geo";
import { geocodeLocation, getLocationRow, isStale, upsertLocation, type LocationRow } from "@/lib/locationApi";
import { markOnboardingStepComplete } from "@/lib/onboardingStatus";

export default function UserLocationPage() {
  const router = useRouter();

  // data
  const [existing, setExisting] = useState<LocationRow | null>(null);

  // ui state
  const [loading, setLoading] = useState(true);    // initial GET
  const [saving, setSaving]   = useState(false);   // asking + posting
  const [denied, setDenied]   = useState(false);   // permission denied
  const [error, setError]     = useState<string | null>(null);
  const [saved, setSaved]     = useState(false);   // success this session
  const [manualOpen, setManualOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [manualCountry, setManualCountry] = useState("United States");
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualBusy, setManualBusy] = useState(false);

  // 1) Silent GET on load (no prompt). If we already have a fresh fix, let user continue.
  useEffect(() => {
    (async () => {
      const row = await getLocationRow();
      setExisting(row);
      if (row && !isStale(row)) setSaved(true);
      setLoading(false);
    })();
  }, []);

  async function handleAsk() {
    setSaving(true);
    setDenied(false);
    setError(null);
    try {
      const perm = await getGeoPermissionState(); // may be "unknown" on Safari
      const fix = await getPositionOnce();        // ask only when user taps

      await upsertLocation(fix, !!existing);
      const fresh = await getLocationRow();
      setExisting(fresh);
      setSaved(true);
      setDenied(false);
    } catch (e: any) {
      // code === 1 → PERMISSION_DENIED in most browsers
      const permanentlyDenied =
        e?.code === 1 || (await getGeoPermissionState()) === "denied";
      setDenied(!!permanentlyDenied);
      setSaved(false);
      setError(permanentlyDenied ? null : (e?.message as string) ?? "Unknown error");
      setManualError(null);
      setManualOpen(true);
    } finally {
      setSaving(false);
    }
  }

  const canContinue = useMemo(() => saved && !saving && !loading, [saved, saving, loading]);

  const help = denied ? getPermissionInstructions() : null;

  async function handleManualSubmit() {
    const clean = manualQuery.trim();
    if (!clean) {
      setManualError("Please enter a city or place name.");
      return;
    }
    setManualBusy(true);
    setManualError(null);
    try {
      const query = manualCountry ? `${clean}, ${manualCountry}` : clean;
      const result = await geocodeLocation(query);
      await upsertLocation(
        {
          latitude: result.latitude,
          longitude: result.longitude,
          accuracy_m: 0,
          place_name: result.placeName || clean,
        },
        !!existing
      );
      const fresh = await getLocationRow();
      setExisting(fresh);
      setSaved(true);
      setDenied(false);
      setManualOpen(false);
    } catch (e: any) {
      setManualError(
        e?.message || "We couldn't find this location. Try adding a city or country."
      );
    } finally {
      setManualBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col items-center text-center px-6">
        <div className="h-6" />
        <h1 className="text-h1 font-semibold text-textMain">My location</h1>

        <div className="h-20 md:h-24" />

        <CircleMediumButton
          href="#"
          icon="/location-pin.svg"
          label={denied ? "Try again" : "Allow geolocation"}
          onClick={handleAsk}
          // green by default, red when denied
          bgColor={denied ? "var(--contrast)" : "var(--main)"}
          textColor={denied ? "var(--contrast)" : "var(--main)"}
        />

        <p
          className={[
            "mt-6 max-w-[24rem] text-h4 leading-snug",
            denied ? "text-[var(--contrast)]" : "text-textMain",
          ].join(" ")}
        >
          {denied
            ? "Location access is blocked. You can enable it in your browser settings, then tap TRY AGAIN."
            : "We need your location to find nearby players. We only request it when you tap the button."}
        </p>

        {error && !denied && (
          <p className="mt-2 text-h5 text-[var(--contrast)]/85">{error}</p>
        )}

        {help && (
          <div className="mt-4 max-w-[26rem] rounded-2xl bg-black/5 p-4 text-left text-h5 text-textMain">
            <div className="font-medium mb-1">{help.title}</div>
            <ol className="list-decimal pl-5 space-y-1">
              {help.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-8 px-6 ">
        <div className="mx-auto w-full max-w-phone">
          <ContinueButton
            label={saving ? "Saving…" : "Continue"}
            disabled={!canContinue}
            onClick={async () => {
              try {
                await markOnboardingStepComplete("location");
              } catch {
                setError("We couldn’t save your progress. Please try again.");
                return;
              }
              router.push("/discover");
            }}
          />
        </div>
      </footer>

      <ManualLocationModal
        open={manualOpen}
        query={manualQuery}
        country={manualCountry}
        onQueryChange={setManualQuery}
        onCountryChange={setManualCountry}
        onSubmit={handleManualSubmit}
        onClose={() => {
          setManualOpen(false);
          setManualError(null);
        }}
        error={manualError}
        isBusy={manualBusy}
      />
    </div>
  );
}
