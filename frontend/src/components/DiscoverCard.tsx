"use client";

import Image from "next/image";
import AgreeButton from "@/components/AgreeButton";
import CancelButton from "@/components/CancelButton";
import { kmToMiles } from "@/lib/units";

export type DiscoverProfile = {
  id: string;
  name: string;
  age: number;
  skillLevel: string;
  distanceKm: number;
  photo: string;
  bio: string;
};

export default function DiscoverCard({
  profile,
  isPeek = false,
  onLike,
  onNope,
}: {
  profile: DiscoverProfile;
  isPeek?: boolean;
  onLike?: () => void;
  onNope?: () => void;
}) {
  return (
    <article
      className={[
        // card container
        "rounded-3xl overflow-hidden bg-bg h-full flex flex-col",  // green area is not applied on the full length of the card
        "min-h-[520px] max-h-[900px]",
        "bg-bg",
        "transform-gpu [backface-visibility:hidden]",
        isPeek ? "opacity-60 grayscale pointer-events-none" : "",
      ].join(" ")}
      aria-label={`${profile.name}, ${profile.age}, ${profile.skillLevel}`}
      style={{ willChange: "transform" }}
    >
      {/* Photo — flexible: shrinks first on small screens */}
      <div
        className="relative flex-shrink-0 flex-1 min-h-[280px] bg-bg"
        style={{ maxHeight: "80%" }}
      >
        <Image
          src={profile.photo}
          alt={`${profile.name}`}
          fill
          className="object-cover"
          sizes="(max-width: 480px) 100vw, 480px"
          priority
        />

        {/* distance pill */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-green-800 text-white px-2.5 py-1 text-[14px] leading-none">
            <Image src="/map-pin.svg" alt="" width={14} height={14} />
            {kmToMiles(profile.distanceKm, 1)} mi
          </span>
        </div>
      </div>

      {/* Info + actions — constant readable sizes */}
      <div className="bg-green-800 text-white flex-shrink-0 space-y-3 px-4 py-4 min-h-[200px]">
        <div className="flex items-center justify-between font-semibold text-[22px] leading-tight">
          <div className="mr-6">
            {profile.name}, {profile.age}
          </div>
          <div className="text-right">{profile.skillLevel}</div>
        </div>

        <p className="text-white leading-relaxed text-[16px]">
          {profile.bio}
        </p>

        {!isPeek && (
          <div
            className="flex items-center justify-center mt-3"
            style={{ gap: "40px" }}
          >
            <CancelButton
              onClick={onNope}
              style={{ width: "112px", height: "112px" }}
            />
            <AgreeButton
              onClick={onLike}
              style={{ width: "112px", height: "112px" }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
