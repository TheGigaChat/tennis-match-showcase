"use client";

import Image from "next/image";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = {
  label?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

export default function AgreeButton({ label = "Agree", className, style, ...rest }: Props) {
  return (
    <button
      aria-label={label}
      className={cn(
        // circular CTA look
        "size-28 md:size-28 rounded-full bg-transparent",
        "inline-flex items-center justify-center",
        "active:scale-[0.98] transition-transform",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60",
        className
      )}
      style={style}
      {...rest}
    >
      {/* Use the exported svg "texture" */}
      <Image 
        src="/agree-button.svg" 
        alt="" 
        width={120} 
        height={120} 
        priority 
        style={{ width: '100%', height: '100%' }}
      />
    </button>
  );
}
