"use client";

import Image from "next/image";
import Link from "next/link";

export default function ChatHeader({
  backHref = "/messages",
  name,
  avatarUrl,
}: {
  backHref?: string;
  name: string;
  avatarUrl?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-t-3xl bg-[var(--main)] px-3 py-4">
      <Link
        href={backHref}
        className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60"
        aria-label="Back"
      >
        <Image src="/arrow-back-light.svg" alt="" width={22} height={22} />
      </Link>

      <div className="flex items-center gap-3 text-white">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-white/20">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <span className="text-[17px] font-medium">{name}</span>
      </div>

      {/* 3 dots (hidden for now, but in code) */}
      <button
        aria-label="More"
        className="invisible rounded-lg p-1 focus-visible:visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60"
      >
        <Image src="/more.svg" alt="" width={22} height={22} />
      </button>
    </div>
  );
}
