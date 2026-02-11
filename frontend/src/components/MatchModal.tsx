"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import SmallActionButton from "@/components/SmallActionButton";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  name?: string | null;
  age?: number | null;
  photoUrl?: string | null;
  onStart: () => void;
  onLater: () => void;
  className?: string;
};

export default function MatchModal({
  open,
  name,
  age,
  photoUrl,
  onStart,
  onLater,
  className,
}: Props) {
  const fallbackPhoto = photoUrl && photoUrl.trim().length > 0 ? photoUrl : "/placeholder-man-image.png";
  const displayName = name ?? "New match";
  const displayAge = typeof age === "number" ? `, ${age}` : "";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />

          <motion.div
            className={cn(
              "relative w-full max-w-sm overflow-hidden rounded-[28px] border border-main/20 bg-bg shadow-2xl",
              className
            )}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,86,40,0.25),_transparent_60%)]" />
            <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-green-700/25 blur-2xl" />
            <div className="absolute -bottom-12 -right-8 h-28 w-28 rounded-full bg-green-500/20 blur-2xl" />

            <div className="relative flex flex-col items-center gap-4 px-6 pb-6 pt-7 text-center">
              <motion.div
                className="text-sm font-semibold uppercase tracking-[0.3em] text-green-900/70"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                It&apos;s a match
              </motion.div>

              <motion.h2
                className="text-h2 font-semibold text-textMain"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                You and {displayName} clicked
              </motion.h2>

              <motion.div
                className="relative mt-1"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <motion.div
                  className="absolute -inset-2 rounded-full border border-green-600/40"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: [0.95, 1.05, 1], opacity: [0.4, 0.8, 0.6] }}
                  transition={{ duration: 1.4, repeat: Infinity, repeatType: "mirror" }}
                />
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
                  <Image src={fallbackPhoto} alt={displayName} fill sizes="96px" className="object-cover" />
                </div>
              </motion.div>

              <div className="text-h4 text-neutral">
                {displayName}
                {displayAge}
              </div>

              <div className="mt-2 w-full space-y-3">
                <SmallActionButton variant="active" onClick={onStart} className="w-full">
                  Start chatting
                </SmallActionButton>
                <SmallActionButton variant="inactive" onClick={onLater} className="w-full">
                  Later
                </SmallActionButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
