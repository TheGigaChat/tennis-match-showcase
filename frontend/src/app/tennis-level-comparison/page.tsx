"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TennisLevelComparison() {
  const router = useRouter();
  const [useFallbackBack, setUseFallbackBack] = useState(false);

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center px-6 py-8">
      <header className="w-full text-left">
        <button
          onClick={() => router.back()}
          className={
            useFallbackBack
              ? "text-main text-h4 font-medium hover:opacity-80"
              : "rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60"
          }
          aria-label="Back"
        >
          {useFallbackBack ? (
            "Back"
          ) : (
            <Image
              src="/arrow-back-dark.svg"
              alt=""
              width={22}
              height={22}
              onError={() => setUseFallbackBack(true)}
            />
          )}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-h1 font-semibold text-textMain mb-6 text-center">
          Tennis Level Comparison
        </h1>

        <Image
          src="/level-comparison-table.jpg"
          // src="/tennis-level-comparison-old.png"
          alt="Tennis level comparison table"
          width={600}
          height={800}
          className="w-full max-w-[600px] rounded-lg shadow-sm"
        />

        <p className="mt-4 text-h5 text-neutral text-center max-w-[500px]">
          This table provides approximate equivalences between UTR, NTRP, and WTN systems.
        </p>
      </main>
    </div>
  );
}
