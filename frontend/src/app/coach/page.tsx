"use client";

import Link from "next/link";
import { useMemo } from "react";
import ProfileCard from "@/components/ProfileCard";
import type { DiscoverProfile } from "@/components/DiscoverCard";
import BottomNav from "@/components/BottomNav";

function useMockProfile(): DiscoverProfile {
  return useMemo(
    () => ({
      id: "me",
      name: "Sahar",
      age: 29,
      skillLevel: "College Player",
      distanceKm: 0, // unused here
      photo: "/temp/pic1.avif",
      bio: "Looking for regular hitting partners! I play mostly on weekends and love competitive matches. Always up for a good game!",
    }),
    []
  );
}

export default function ProfilePage() {
  const me = useMockProfile();

  return (
    <div className="min-h-dvh bg-bg">
      <div
        className="mx-auto w-full max-w-phone px-4 pt-4 flex flex-col gap-4"
        style={{ minHeight: "100dvh", paddingBottom: "80px" }}
      >
        {/* header */}
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "clamp(20px, 6vh, 56px)" }}
        >
          <Link
            href="/"
            style={{ fontSize: "clamp(36px, 4.3vw, 36px)" }}
            className="font-bold text-[var(--main)]"
          >
            TennisMatch
          </Link>
        </div>

        {/* card area */}
        <div className="relative z-20 flex-1 overflow-y-auto pb-4" style={{ minHeight: 0, paddingBottom: "16px" }}>
          <div
            className="relative mx-auto w-full max-w-phone grid place-items-center"
            style={{
              height: "min(1000px, calc(100dvh - 80px - 56px - 24px))",
            }}
          >
            <div className="absolute inset-0">
              {/* <ProfileCard profile={me} /> */}
                <div className="w-full h-full rounded-3xl bg-bg grid place-items-center">
                    <p className="text-[var(--main)] font-semibold text-3xl">
                        Coming soon
                    </p>
                </div>
            </div>
          </div>
        </div>

        {/* bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}
