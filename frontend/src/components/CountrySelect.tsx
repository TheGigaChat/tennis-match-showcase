"use client";

import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export default function CountrySelect({
  value,
  onChange,
  disabled = false,
  className,
  id,
}: Props) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full rounded-xl border border-neutral px-3 py-2 outline-none focus:border-[var(--main)] bg-white",
        className
      )}
    >
      {COUNTRIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
