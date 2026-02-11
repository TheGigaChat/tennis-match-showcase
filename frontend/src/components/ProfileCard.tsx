"use client";

import Image from "next/image";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
// import type { DiscoverProfile } from "@/components/DiscoverCard";
import type { MeProfile } from "@/lib/api/profile";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export default function ProfileCard({ profile }: { profile: MeProfile }) {
  return (
    <article
      aria-label={`${profile.name}, ${profile.age}, ${profile.skillLevel}`}
      className={[
        "relative rounded-[28px] overflow-hidden h-full flex flex-col",
        "min-h-[520px]",
        "transform-gpu [backface-visibility:hidden] transition-transform duration-500",
      ].join(" ")}
      style={{
        willChange: "transform",
        backgroundColor: "var(--profile-card-surface)",
        border: "1px solid var(--profile-card-border)",
        boxShadow: "var(--profile-card-shadow)",
      }}
    >
      {/* Photo */}
      <div
        className="relative flex-shrink-0 flex-1 min-h-[280px]"
      >
        <Image
          src={profile.photo}
          alt={profile.name}
          fill
          className="object-cover"
          sizes="(max-width: 480px) 100vw, 480px"
          priority
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--profile-photo-vignette)" }}
        />
        <div
          className="absolute inset-x-0 top-0 h-20"
          style={{ background: "var(--profile-photo-topfade)" }}
        />
        {/* NOTE: no distance pill on Profile page */}
      </div>

      {/* Info + actions */}
      <div
        className="relative flex-shrink-0 space-y-4 px-5 py-5 min-h-[220px] text-[var(--profile-info-text)]"
        style={{ background: "var(--profile-info-bg)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div
              className={`${spaceGrotesk.className} text-[28px] leading-tight text-[var(--profile-name-text)]`}
            >
              {profile.name}, {profile.age}
            </div>
          </div>
          <div className="shrink-0">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{
                border: "1px solid var(--profile-badge-border)",
                backgroundColor: "var(--profile-badge-bg)",
                color: "var(--profile-badge-text)",
              }}
            >
              <span
                className="block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--profile-badge-dot)" }}
              />
              {profile.skillLevel}
            </span>
          </div>
        </div>

        <div>
          <p className="text-[15px] leading-relaxed text-[var(--profile-bio-text)]">
            {profile.bio}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <Link
            href="/edit-profile"
            className={[
              "flex-1 rounded-full px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em]",
              "text-white",
              "transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0",
              "focus-visible:outline-none focus-visible:ring-2",
            ].join(" ")}
            style={{
              backgroundColor: "var(--profile-cta-bg)",
              boxShadow: "var(--profile-cta-shadow)",
              ["--tw-ring-color" as any]: "var(--profile-cta-ring)",
            }}
          >
            Edit Profile
          </Link>
          <button
            type="button"
            aria-label="Coach"
            disabled
            className={[
              "grid h-11 w-11 place-items-center rounded-full",
              "shadow-sm",
              "opacity-60 cursor-not-allowed",
            ].join(" ")}
            style={{
              border: "1px solid var(--profile-icon-border)",
              color: "var(--profile-icon-muted)",
              backgroundColor: "var(--profile-icon-bg-muted)",
            }}
          >
            <Image src="/coach.svg" alt="" width={20} height={20} />
          </button>
          <Link
            href="/settings?page=settings"
            aria-label="Preferences"
            className={[
              "grid h-11 w-11 place-items-center rounded-full",
              "shadow-sm",
              "transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0",
              "focus-visible:outline-none focus-visible:ring-2",
            ].join(" ")}
            style={{
              border: "1px solid var(--profile-icon-border)",
              color: "var(--profile-icon-text)",
              backgroundColor: "var(--profile-icon-bg)",
              boxShadow: "var(--profile-icon-shadow)",
              ["--tw-ring-color" as any]: "var(--profile-cta-ring)",
            }}
          >
            <Image src="/preferences.svg" alt="" width={20} height={20} />
          </Link>
        </div>
      </div>
    </article>
  );
}
