"use client";

import { useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import SmallActionButton from "@/components/SmallActionButton";
import CountrySelect from "@/components/CountrySelect";

type Props = {
  open: boolean;
  query: string;
  country: string;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  error?: string | null;
  isBusy?: boolean;
};

export default function ManualLocationModal({
  open,
  query,
  country,
  onQueryChange,
  onCountryChange,
  onSubmit,
  onClose,
  error,
  isBusy = false,
}: Props) {
  const titleId = useId();
  const inputId = useId();
  const selectId = useId();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "relative mx-6 w-full max-w-sm rounded-2xl border border-main/10 bg-bg p-6 shadow-xl"
            )}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <h2 id={titleId} className="text-h3 font-semibold text-textMain">
              Enter your location
            </h2>
            <p className="mt-2 text-h5 text-neutral">
              Street, city, or place name
            </p>

            <label htmlFor={inputId} className="sr-only">
              Location
            </label>
            <input
              id={inputId}
              type="text"
              placeholder="3225 Grim Avenue, San Diego"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              disabled={isBusy}
              className={cn(
                "mt-4 w-full border-b outline-none bg-transparent text-h4 text-textMain placeholder:text-neutral",
                error ? "border-red-500" : "border-neutral"
              )}
              inputMode="text"
              autoComplete="street-address"
              aria-invalid={!!error}
              aria-describedby={error ? `${inputId}-error` : undefined}
            />

            <label htmlFor={selectId} className="sr-only">
              Country
            </label>
            <CountrySelect
              id={selectId}
              value={country}
              onChange={onCountryChange}
              disabled={isBusy}
              className="mt-4 border-neutralLight text-h5 text-textMain"
            />

            {error && (
              <p id={`${inputId}-error`} role="alert" className="mt-2 text-h5 text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <SmallActionButton
                variant="inactive"
                onClick={onClose}
                disabled={isBusy}
                className="flex-1"
              >
                Cancel
              </SmallActionButton>
              <SmallActionButton
                variant="active"
                onClick={onSubmit}
                disabled={isBusy}
                className="flex-1"
              >
                {isBusy ? "Searching..." : "Use this location"}
              </SmallActionButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
