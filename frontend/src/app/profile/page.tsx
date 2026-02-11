"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProfileCard from "@/components/ProfileCard";
import BottomNav from "@/components/BottomNav";
// import type { DiscoverProfile } from "@/components/DiscoverCard";
import { fetchMyProfile } from "@/lib/api/profile";
import type { MeProfile } from "@/lib/api/profile";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export default function ProfilePage() {
  const [me, setMe] = useState<MeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const data = await fetchMyProfile();
      if (!data) {
        window.location.href = "/registration";
        return;
      }
      if (data) {
        setMe({
          id: data.id,
          name: data.name,
          age: data.age,
          skillLevel: data.skillLevel,
          // distanceKm: 0, // unused on Profile page
          photo: data.photo,
          bio: data.bio,
        });
      }
      setIsLoading(false);
    })();
  }, []);

  return (
    <div className="relative h-dvh overflow-hidden bg-bg">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{ background: "var(--profile-bg-gradient)" }}
        />
        <div
          className="absolute -right-24 top-40 h-72 w-72 rounded-full"
          style={{
            background: "var(--profile-bg-blob-1)",
            filter: "blur(10px)",
          }}
        />
        <div
          className="absolute -left-28 bottom-16 h-64 w-64 rounded-full"
          style={{
            background: "var(--profile-bg-blob-2)",
            filter: "blur(8px)",
          }}
        />
      </div>
      <div
        className="mx-auto flex h-full w-full max-w-phone flex-col gap-4 px-4 pt-4"
        style={{ paddingBottom: "var(--nav-height)" }}
      >
        {/* header */}
        <div
          className="relative z-10 flex flex-col items-center justify-center gap-2"
          style={{ minHeight: "clamp(20px, 6vh, 56px)" }}
        >
          <Link
            href="/"
            className={[
              spaceGrotesk.className,
              "font-semibold tracking-[0.06em] text-[var(--profile-header-text)]",
              "rounded-full px-3 py-1 backdrop-blur-[2px]",
            ].join(" ")}
            style={{
              fontSize: "clamp(28px, 3.6vw, 32px)",
              boxShadow: "var(--profile-header-pill-shadow)",
              backgroundColor: "var(--profile-header-pill-bg)",
            }}
          >
            TennisMatch
          </Link>
        </div>

        {/* card area */}
        <div className="relative z-20 flex-1 min-h-0">
          <div className="relative mx-auto h-full w-full max-w-phone grid place-items-center">
            <div className="absolute inset-0">
              {isLoading && (
                <div className="h-full w-full rounded-3xl bg-neutral/10 animate-pulse" />
              )}
              {!isLoading && me && <ProfileCard profile={me} />}
              {!isLoading && !me && (
                <div className="grid place-items-center h-full rounded-3xl bg-neutral/10 text-[var(--error)]">
                  Failed to load profile
                </div>
              )}
            </div>
          </div>
        </div>

        {/* bottom nav */}
        <BottomNav active="profile" />
      </div>
    </div>
  );
}
