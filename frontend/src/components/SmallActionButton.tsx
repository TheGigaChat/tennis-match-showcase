"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "active" | "inactive";

type Props = {
  variant?: Variant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function SmallActionButton({
  variant = "inactive",
  className,
  ...rest
}: Props) {
  const base =
    "rounded-xl px-4 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const active = "bg-main text-white hover:brightness-95";
  const inactive = "border border-neutralLight text-textMain hover:bg-neutralLight/30";

  return (
    <button
      type="button"
      className={cn(base, variant === "active" ? active : inactive, className)}
      {...rest}
    />
  );
}
