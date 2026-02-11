"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "minimal";

type Props = {
  label: string;
  variant?: Variant;
  className?: string;
};

export default function LoadingIndicator({
  label,
  variant = "minimal",
  className,
}: Props) {
  if (variant !== "minimal") {
    variant = "minimal";
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="flex gap-2">
        <motion.span
          className="h-2.5 w-2.5 rounded-full bg-main"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="h-2.5 w-2.5 rounded-full bg-main"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
        />
        <motion.span
          className="h-2.5 w-2.5 rounded-full bg-main"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
      </div>
      <p className="text-h5 text-neutral">{label}</p>
    </div>
  );
}
