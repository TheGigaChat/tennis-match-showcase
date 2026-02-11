"use client";

import ContinueButton from "@/components/ContinueButton";
import AddPhotoInput from "@/components/AddPhotoInput";
import ConfirmModal from "@/components/ConfirmModal";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/cookies";
import { markOnboardingStepComplete } from "@/lib/onboardingStatus";
import { getDefaultPhotoUrl } from "@/lib/profilePhotos";


/* ================= REST helpers ================= */

/** Backend returns PhotoDto. Use the first matching URL field. */
function extractPhotoUrl(dto: any): string | null {
    if (!dto || typeof dto !== "object") return null;
    return dto.url || dto.publicUrl || dto.href || dto.link || null;
}

/** Get current photo (or null if none yet) */
async function fetchProfilePhoto(): Promise<string | null> {
    const res = await apiFetch("/profile/photo", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
    });

    if (res.status === 204) return null;
    if (res.status === 401 || res.status === 403) {
        // Unauthorized — return null for UX; router may redirect higher in the tree.
        return null;
    }
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to load photo");
    }

    const data = await res.json().catch(() => ({}));
    return extractPhotoUrl(data);
}

type ProfileGender = "MALE" | "FEMALE";

async function fetchProfileGender(): Promise<ProfileGender | null> {
    const res = await apiFetch("/profile/me", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    const raw = typeof data?.gender === "string" ? data.gender.toUpperCase() : "";
    return raw === "MALE" || raw === "FEMALE" ? (raw as ProfileGender) : null;
}

/** Upload/replace photo: POST multipart/form-data with "file" field */
async function uploadProfilePhoto(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);

    const res = await apiFetch("/profile/photo", {
        method: "POST",
        headers: {
            Accept: "application/json",
        },
        body: form,
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let msg = txt;
        try {
            const j = JSON.parse(txt);
            msg = j?.message || msg;
        } catch {}
        throw new Error(msg || "Upload failed");
    }

    const data = await res.json().catch(() => ({}));
    const url = extractPhotoUrl(data);
    if (!url) throw new Error("Upload succeeded but no URL returned");
    return url;
}

async function setProfilePhotoUrl(photoUrl: string): Promise<void> {
    const res = await apiFetch("/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl }),
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let msg = txt;
        try {
            const j = JSON.parse(txt);
            msg = j?.message || msg;
        } catch {}
        throw new Error(msg || "Failed to save photo");
    }
}

async function removeProfilePhoto(): Promise<void> {
    const res = await apiFetch("/profile/photo", {
        method: "DELETE",
        headers: {
            Accept: "application/json",
        },
    });
    if (!res.ok && res.status !== 204) {
        const txt = await res.text().catch(() => "");
        let msg = txt;
        try {
            const j = JSON.parse(txt);
            msg = j?.message || msg;
        } catch {}
        throw new Error(msg || "Delete failed");
    }
}

/* ================= Page ================= */

export default function Page() {
    const router = useRouter();

    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // blob: | remote
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showDefaultModal, setShowDefaultModal] = useState(false);
    const [error, setError] = useState("");

    // Prefill from backend
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const existing = await fetchProfilePhoto();
                if (!ignore && existing) setPreviewUrl(existing);
            } catch (e: any) {
                if (!ignore) setError(e?.message || "Could not load your profile. You can still continue.");
            } finally {
                if (!ignore) setIsLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, []);

    // Revoke blob URL on unmount/replace
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleSelect = (chosen: File, objectUrl: string) => {
        if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setFile(chosen);
        setPreviewUrl(objectUrl);
        setError("");
    };

    const handleRemoveLocal = () => {
        if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setFile(null);
        setPreviewUrl(null);
    };

    const handleRemove = async () => {
        setError("");
        try {
            // If it's already uploaded (not a blob), delete it on the backend.
            if (previewUrl && !previewUrl.startsWith("blob:")) {
                await removeProfilePhoto();
            }
            handleRemoveLocal();
        } catch (e: any) {
            setError(e?.message || "Could not remove photo. Please try again.");
        }
    };

    const handleConfirmDefaultPhoto = async () => {
        setError("");
        setShowDefaultModal(false);
        try {
            setIsSaving(true);
            const gender = await fetchProfileGender();
            const defaultUrl = getDefaultPhotoUrl(gender);
            await setProfilePhotoUrl(defaultUrl);
            setPreviewUrl(defaultUrl);
            setFile(null);
            await markOnboardingStepComplete("profilePhoto");
            router.push("/user-preferences");
        } catch (e: any) {
            setError(e?.message || "We couldn't save your photo. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleContinue = async () => {
        setError("");
        if (!hasPhoto) {
            setShowDefaultModal(true);
            return;
        }
        try {
            setIsSaving(true);

            // Upload only if the user picked a local file (blob URL)
            if (file) {
                const url = await uploadProfilePhoto(file);
                setPreviewUrl(url); // replace blob with real CDN/remote URL
                setFile(null); // local file no longer needed
            }

            // Move to the next onboarding step
            await markOnboardingStepComplete("profilePhoto");
            router.push("/user-preferences");
        } catch (e: any) {
            setError(e?.message || "We couldn't save your photo. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const hasPhoto = !!previewUrl;

    return (
        <>
            <main className="mt-6">
                <h1 className="text-center text-h1 font-semibold text-textMain">
                    Add a Profile <span className="block">Photo</span>
                </h1>
                <p className="mt-2 text-center text-h4 text-neutral">This photo will be public.</p>

                <div className="mt-8 flex justify-center">
                    <AddPhotoInput
                        previewUrl={previewUrl}
                        onSelect={handleSelect}
                        onRemove={handleRemove}
                        className="w-[280px] h-[360px] sm:w-[320px] sm:h-[420px]"
                    />
                </div>

                {error && (
                    <p className="mt-4 text-center text-h5 text-red-600" role="alert">
                        {error}
                    </p>
                )}
            </main>

            <footer className="mt-auto pt-4 pb-[env(safe-area-inset-bottom)]">
                <ContinueButton
                    label={isSaving ? "Saving..." : "Continue"}
                    onClick={handleContinue}
                    disabled={isLoading || isSaving}
                />
            </footer>
            <ConfirmModal
                open={showDefaultModal}
                title="No Photo Uploaded"
                description={
                    <>
                        You haven&apos;t uploaded any photo. We&apos;ll use a default photo
                        for now. You can upload your photo later.
                    </>
                }
                confirmLabel="OK"
                cancelLabel="Cancel"
                onConfirm={handleConfirmDefaultPhoto}
                onCancel={() => setShowDefaultModal(false)}
                isBusy={isSaving}
                overlay
            />
        </>
    );
}


