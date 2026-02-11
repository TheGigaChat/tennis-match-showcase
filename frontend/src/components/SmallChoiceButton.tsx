// src/components/SmallChoiceButton.tsx
"use client";

import { cn } from "@/lib/cn";
import { ButtonHTMLAttributes } from "react";

type Props = {
  label: string;
  selected?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

export default function SmallChoiceButton({
  label,
  selected,
  disabled = false,
  className,
  ...rest
}: Props) {
  const disabledCls = "bg-neutralLight text-white cursor-not-allowed border-transparent";
  const enabledCls = selected
    ? "bg-green-800 text-white border-transparent shadow-sm"
    : "bg-white text-green-900 border-green-900/80 hover:bg-green-50";

  return (
    <button
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      className={cn(
        // equal sizing + centering
        "w-full h-12 inline-flex items-center justify-center whitespace-nowrap",
        // style
        "rounded-xl border text-base font-medium transition",
        disabled ? disabledCls : enabledCls,
        // focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60",
        className
      )}
      {...rest}
    >
      {label}
    </button>
  );
}
