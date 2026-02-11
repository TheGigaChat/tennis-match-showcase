"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function ComingSoonPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <div
        className="mx-auto w-full max-w-phone px-4 pt-4 flex flex-col gap-2"
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

        {/* placeholder card */}
        <div className="relative z-20 flex-1 overflow-y-auto pb-4" style={{ minHeight: 0 }}>
          <div
            className="relative mx-auto w-full max-w-phone grid place-items-center"
            style={{
              height: "min(1000px, calc(100dvh - 80px - 56px - 24px))",
            }}
          >
            <div className="w-full h-full rounded-3xl bg-bg grid place-items-center">
              <p className="text-[var(--main)] font-semibold text-3xl">
                Coming soon
              </p>
            </div>
          </div>
        </div>

        {/* bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}
