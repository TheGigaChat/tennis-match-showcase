"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MeProfile } from "@/lib/api/profile";
import { getMyProfile, updateMyProfile, uploadProfilePhoto } from "@/lib/api/profile";
import { LEVEL_LABEL } from "@/lib/skillLevels";
import CountrySelect from "@/components/CountrySelect";
import BottomNav from "@/components/BottomNav";
import ConfirmModal from "@/components/ConfirmModal";
import {
  geocodeLocation,
  getLocationRow,
  upsertLocation,
  type LocationRow,
} from "@/lib/locationApi";

type Snapshot = {
  name: string;
  skill: MeProfile["skillLevel"];
  bio: string;
  photo: string;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<MeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [skill, setSkill] = useState<MeProfile["skillLevel"]>("Beginner");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [locationRow, setLocationRow] = useState<LocationRow | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [initialLocationQuery, setInitialLocationQuery] = useState("");
  const [locationCountry, setLocationCountry] = useState("United States");
  const [isManualLocationActive, setIsManualLocationActive] = useState(false);
  const [manualLocationPromptOpen, setManualLocationPromptOpen] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<Snapshot | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  // autosize for bio
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const BIO_MAX = 100;
  const bioLeft = useMemo(() => Math.max(0, BIO_MAX - bio.length), [bio]);

  const locationTrimmed = locationQuery.trim();
  const initialLocationTrimmed = initialLocationQuery.trim();
  const locationDirty = locationTrimmed !== initialLocationTrimmed;

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return (
      name !== initialSnapshot.name ||
      skill !== initialSnapshot.skill ||
      bio !== initialSnapshot.bio ||
      photo !== initialSnapshot.photo ||
      selectedFile !== null ||
      locationDirty
    );
  }, [name, skill, bio, photo, selectedFile, locationDirty, initialSnapshot]);

  const isSaveDisabled = isSaving || !isDirty;
  const saveLabel = isSaving
    ? "Saving..."
    : saveState === "saved" && !isDirty
      ? "Saved"
      : "Save changes";

  // initial load
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [data, loc] = await Promise.all([getMyProfile(), getLocationRow()]);
        setMe(data);
        setLocationRow(loc);
        const placeName = loc?.place_name ?? "";
        setLocationQuery(placeName);
        setInitialLocationQuery(placeName);
        setIsManualLocationActive(!loc || !!placeName);
        const nextName = data.name ?? "";
        const nextSkill = data.skillLevel ?? "Beginner";
        const nextBio = data.bio ?? "A passionate tennis lover looking for local players.";
        const nextPhoto = data.photo ?? "";
        setName(nextName);
        setSkill(nextSkill);
        setBio(nextBio);
        setPhoto(nextPhoto);
        setInitialSnapshot({
          name: nextName,
          skill: nextSkill,
          bio: nextBio,
          photo: nextPhoto,
        });
        setSaveState("idle");
      } catch {
        setError("Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // autosize bio
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "0px";
    taRef.current.style.height = Math.max(56, taRef.current.scrollHeight) + "px";
  }, [bio, isLoading]);

  // revoke blob on unmount
  useEffect(() => {
    return () => {
      if (photo && photo.startsWith("blob:")) {
        URL.revokeObjectURL(photo);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (saveState === "saved" && isDirty) {
      setSaveState("idle");
    }
  }, [saveState, isDirty]);

  async function onPickPhoto(file: File) {
    setError(null);

    if (photo && photo.startsWith("blob:")) {
      URL.revokeObjectURL(photo);
    }

    const objectUrl = URL.createObjectURL(file);
    setPhoto(objectUrl);
    setSelectedFile(file);
  }

  async function onSave() {
    if (!me || isSaving || !isDirty) return;
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!locationRow && !locationTrimmed) {
      setError("Please add your location.");
      return;
    }
    if (locationDirty && !locationTrimmed) {
      setError("Please add your location.");
      return;
    }

    setIsSaving(true);
    setSaveState("saving");
    setError(null);

    try {
      if (locationDirty) {
        const query = locationCountry
          ? `${locationTrimmed}, ${locationCountry}`
          : locationTrimmed;
        const result = await geocodeLocation(query);
        const placeName = result.placeName || locationTrimmed;
        await upsertLocation(
          {
            latitude: result.latitude,
            longitude: result.longitude,
            accuracy_m: 0,
            place_name: placeName,
          },
          !!locationRow
        );
        const fresh = await getLocationRow();
        setLocationRow(fresh);
        setLocationQuery(placeName);
        setInitialLocationQuery(placeName);
      }

      let finalPhoto = photo;

      if (selectedFile) {
        const photoDto = await uploadProfilePhoto(selectedFile);
        finalPhoto = photoDto.url;
        setPhoto(finalPhoto);
        setSelectedFile(null);
      }

      const updated = await updateMyProfile({
        ...me,
        name: name.trim(),
        skillLevel: skill,
        bio: bio.slice(0, BIO_MAX),
      });

      const nextPhoto = finalPhoto || updated.photo || me.photo || "";
      const next = { ...updated, photo: nextPhoto };
      setMe(next);
      setName(next.name ?? name.trim());
      setSkill(next.skillLevel ?? skill);
      setBio(next.bio ?? bio.slice(0, BIO_MAX));
      setPhoto(nextPhoto);
      setInitialSnapshot({
        name: next.name ?? name.trim(),
        skill: next.skillLevel ?? skill,
        bio: next.bio ?? bio.slice(0, BIO_MAX),
        photo: nextPhoto,
      });
      setSaveState("saved");
      router.replace("/profile");
    } catch (e: any) {
      setError(e?.message || "Failed to save changes.");
      setSaveState("idle");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div
        className="mx-auto w-full max-w-phone px-4 pt-4 flex flex-col gap-4"
        style={{ minHeight: "100dvh", paddingBottom: "80px" }}
      >
        {/* header */}
        <div
          className="flex items-center justify-between"
          style={{ minHeight: "clamp(20px, 6vh, 56px)" }}
        >
          <Link
            href="/"
            style={{ fontSize: "clamp(36px, 4.3vw, 36px)" }}
            className="font-bold text-[var(--main)]"
          >
            TennisMatch
          </Link>

          <Link
            href="/profile"
            className="rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60"
            aria-label="Cancel editing"
          >
            <Image src="/cancel.svg" alt="" width={28} height={28} />
          </Link>
        </div>

        {/* content */}
        <div
          className="relative flex-1 overflow-y-auto pb-4"
          style={{ minHeight: 0, paddingBottom: "16px" }}
        >
          <div
            className="relative mx-auto w-full max-w-phone"
            style={{ minHeight: "min(1000px, calc(100dvh - 80px - 56px - 24px))" }}
          >
            {/* edit card */}
            <div className="rounded-3xl bg-white shadow-md p-4">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-40 w-full rounded-2xl bg-neutral/10" />
                  <div className="mt-4 h-6 w-40 rounded bg-neutral/10" />
                  <div className="mt-2 h-10 w/full rounded bg-neutral/10" />
                  <div className="mt-4 h-6 w-24 rounded bg-neutral/10" />
                  <div className="mt-2 h-10 w-full rounded bg-neutral/10" />
                  <div className="mt-4 h-6 w-24 rounded bg-neutral/10" />
                  <div className="mt-2 h-24 w-full rounded bg-neutral/10" />
                  <div className="mt-6 h-12 w-full rounded bg-neutral/10" />
                </div>
              ) : (
                <>
                  {/* Photo */}
                  <div className="relative">
                    <div className="aspect-[4/5] min-h-[280px] w-full overflow-hidden rounded-2xl border border-neutral bg-neutral/10 grid place-items-center">
                      {photo ? (
                        <img
                          src={photo}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-neutral">No photo</span>
                      )}
                    </div>
                    <label
                      className={[
                        "absolute bottom-3 right-3 rounded-xl bg-black/70 px-3 py-2 text-white text-sm",
                        "focus-within:ring-2 focus-within:ring-green-800/60 cursor-pointer",
                      ].join(" ")}
                    >
                      Change photo
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={isSaving}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) onPickPhoto(f);
                        }}
                      />
                    </label>
                  </div>

                  {error && (
                    <div className="mt-4 rounded-xl bg-[var(--errorBg,#fdecec)] text-[var(--error,#9b1c1c)] px-3 py-2 text-sm">
                      {error}
                    </div>
                  )}

                  <Field label="Name">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-neutral px-3 py-2 outline-none focus:border-[var(--main)]"
                      disabled={isSaving}
                    />
                  </Field>

                  <Field label="Location">
                    {isManualLocationActive ? (
                      <input
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        placeholder="street, city"
                        className="w-full rounded-xl border border-neutral px-3 py-2 outline-none focus:border-[var(--main)]"
                        disabled={isSaving}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setManualLocationPromptOpen(true)}
                        disabled={isSaving}
                        className={[
                          "w-full rounded-xl border border-neutral px-3 py-2 text-left",
                          "bg-neutral/10 text-neutral",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60",
                        ].join(" ")}
                      >
                        Location (auto-detected)
                      </button>
                    )}
                    {!isManualLocationActive && (
                      <div className="mt-2 text-xs text-neutral">
                        Tap to change manually
                      </div>
                    )}
                  </Field>

                  <Field label="Country">
                    <CountrySelect
                      value={locationCountry}
                      onChange={setLocationCountry}
                      disabled={isSaving}
                    />
                  </Field>

                  <Field label="Skill level">
                    <select
                      value={skill}
                      onChange={(e) =>
                        setSkill(e.target.value as MeProfile["skillLevel"])
                      }
                      className="w-full rounded-xl border border-neutral px-3 py-2 outline-none focus:border-[var(--main)] bg-white"
                      disabled={isSaving}
                    >
                      {Object.entries(LEVEL_LABEL).map(([_, label]) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label={
                      <div className="flex items-center justify-between">
                        <span>Bio</span>
                        <span className="text-neutral text-xs">{bioLeft}</span>
                      </div>
                    }
                  >
                    <textarea
                      ref={taRef}
                      rows={1}
                      maxLength={BIO_MAX}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A passionate tennis lover looking for local players."
                      className="w-full resize-none rounded-xl border border-neutral px-3 py-2 leading-[1.4] outline-none focus:border-[var(--main)]"
                      disabled={isSaving}
                      style={{ overflow: "hidden" }}
                    />
                  </Field>

                  <button
                    onClick={onSave}
                    disabled={isSaveDisabled}
                    className={[
                      "mt-4 w-full rounded-2xl px-4 py-3 text-center font-semibold",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60",
                      isSaving
                        ? "bg-neutral text-white/70"
                        : isDirty
                          ? "bg-[var(--main)] text-white"
                          : "bg-[var(--main-dark)] opacity-70 text-white/80",
                    ].join(" ")}
                  >
                    {saveLabel}
                  </button>

                  <div className="mt-3 text-center">
                    <Link
                      href="/profile"
                      className="text-sm underline text-[var(--main)]"
                    >
                      Back to profile
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* bottom nav */}
        <BottomNav active="profile" backgroundClassName="bg-bg" />
      </div>

      <ConfirmModal
        open={manualLocationPromptOpen}
        title="Change location manually?"
        description="Your location was auto-detected during registration. Do you want to change it manually?"
        confirmLabel="Yes, edit"
        cancelLabel="Cancel"
        onCancel={() => setManualLocationPromptOpen(false)}
        onConfirm={() => {
          setIsManualLocationActive(true);
          setManualLocationPromptOpen(false);
        }}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-sm font-medium text-textMain">{label}</div>
      {children}
    </div>
  );
}
