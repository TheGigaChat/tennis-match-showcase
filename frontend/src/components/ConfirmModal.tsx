"use client";

import { ReactNode, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import SmallActionButton from "@/components/SmallActionButton";

type Props = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isBusy?: boolean;
  overlay?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isBusy = false,
  overlay = true,
  className,
  overlayClassName,
  contentClassName,
}: Props) {
  const titleId = useId();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {overlay && (
            <motion.div
              className={cn("absolute inset-0 bg-black/50", overlayClassName)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
          )}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "relative mx-6 w-full max-w-sm rounded-2xl border border-main/10 bg-bg p-6 text-center shadow-xl",
              className
            )}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <h2 id={titleId} className="text-h3 font-semibold text-textMain">
              {title}
            </h2>
            {description && (
              <div className={cn("mt-2 text-h5 text-neutral", contentClassName)}>
                {description}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <SmallActionButton
                variant="inactive"
                onClick={onCancel}
                disabled={isBusy}
                className="flex-1"
              >
                {cancelLabel}
              </SmallActionButton>
              <SmallActionButton
                variant="active"
                onClick={onConfirm}
                disabled={isBusy}
                className="flex-1"
              >
                {confirmLabel}
              </SmallActionButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
