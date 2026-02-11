// app/discover/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import DiscoverCard, { DiscoverProfile as Profile } from "@/components/DiscoverCard";
import LoadingIndicator from "@/components/LoadingIndicator";
import BottomNav from "@/components/BottomNav";
import MatchModal from "@/components/MatchModal";
import { useDeck } from "@/hooks/useDeck";

export default function DiscoverPage() {
  const { top, peek, leaving, like, nope, isLoading, match, clearMatch } = useDeck();
  const router = useRouter();

  const handleStartChat = () => {
    if (!match?.conversationId) {
      clearMatch();
      return;
    }
    const conversationId = match.conversationId;
    clearMatch();
    router.push(`/messages/${conversationId}`);
  };

  const handleLater = () => clearMatch();

  const showEmpty = !isLoading && !top && !peek;

  return (
    <div className="h-dvh overflow-hidden bg-bg">
      <div className="mx-auto flex h-full w-full max-w-phone flex-col gap-4 px-4 pt-4" style={{ paddingBottom: "80px" }}>
        {/* header */}
        <div className="flex items-center justify-between" style={{ minHeight: "clamp(40px, 6vh, 56px)" }}>
          <Link href="/" style={{ fontSize: "clamp(24px, 4.3vw, 36px)" }} className="font-bold text-green-900">
            TennisMatch
          </Link>
          <Link href="/settings?page=discover" aria-label="Preferences" className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60">
            <Image src="/gear.svg" alt="" width={24} height={24} style={{ width: "clamp(20px, 3vw, 28px)", height: "auto" }} />
          </Link>
        </div>

        {/* stack container */}
        <div className="relative z-20 flex-1 pb-4 scrollbar-none" style={{ minHeight: 0, paddingBottom: "16px" }}>
          <div className="absolute inset-x-0 top-0 bottom-4 pointer-events-none" />

          {/* Placeholder when no cards are available */}
          {showEmpty && (
            <div className="absolute inset-x-0 top-0 bottom-4 grid place-items-center text-center text-green-900 text-lg font-medium px-6 pointer-events-none">
              We can’t find partners with your preferences. Try again later.
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-x-0 top-0 bottom-4 grid place-items-center pointer-events-none">
              <motion.div
                className="w-[280px] h-[360px] sm:w-[320px] sm:h-[420px]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <LoadingIndicator label="Finding matches..." variant="minimal" className="h-full w-full" />
              </motion.div>
            </div>
          )}

          {/* Peek (back) card */}
          {peek && (
            <div className="absolute inset-x-0 top-0 bottom-4 pointer-events-none">
              <DiscoverCard profile={peek as Profile} isPeek />
            </div>
          )}

          {/* Spacer only when we actually have a card; avoids extra scroll on empty */}
          {!showEmpty && ( // NEW
            <div
              className="relative mx-auto w-full max-w-phone grid place-items-center"
              style={{ height: "min(1000px, calc(100dvh - 80px - 56px - 24px))" }}
            />
          )}

          {/* Top (front) card */}
          <AnimatePresence initial={false}>
            {top && (
              <motion.div
                key={top.id}
                className="absolute inset-x-0 top-0 bottom-4 transform-gpu [backface-visibility:hidden]"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={leaving === "left" ? { x: -420, rotate: -12, opacity: 0 } : { x: 420, rotate: 12, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.35 }}
                style={{ willChange: "transform" }}
              >
                <DiscoverCard profile={top as Profile} onLike={like} onNope={nope} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* bottom nav */}
        <BottomNav active="discover" navClassName="z-30" />
      </div>

      <MatchModal
        open={Boolean(match)}
        name={match?.name}
        age={match?.age ?? undefined}
        photoUrl={match?.photoUrl ?? undefined}
        onStart={handleStartChat}
        onLater={handleLater}
      />
    </div>
  );
}
