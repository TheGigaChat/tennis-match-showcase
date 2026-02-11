"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PlusButton from "./PlusButton";
import SmallCancelButton from "./SmallCancelButton";

export default function AddPhotoInput({
  previewUrl,
  onSelect,
  onRemove,
  className = "",
  imageClassName = "",
}: {
  /** object URL or remote URL for preview; null = empty state */
  previewUrl: string | null;
  /** fires with chosen File and created objectURL */
  onSelect: (file: File, objectUrl: string) => void;
  /** remove/reset */
  onRemove: () => void;
  /** size/shape controller for outer card (e.g. "w-64 h-80") */
  className?: string;
  /** optional extra classes for the <Image> */
  imageClassName?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // cleanup object URLs if parent revokes externally; nothing to do here

  const openPicker = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onSelect(file, url);
  };

  useEffect(() => {
    // clear input value so re-choosing the same file triggers onChange
    if (!previewUrl && fileInputRef.current) fileInputRef.current.value = "";
  }, [previewUrl]);

  const hasPhoto = !!previewUrl;

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border-2 border-main/90 bg-bg",
        "shadow-[0_0_0_1px_rgba(0,0,0,0.02)]",
        // default size close to your mock; override per-page via className
        "w-[270px] h-[360px] sm:w-[300px] sm:h-[400px]",
        className,
      ].join(" ")}
    >
      {/* file input (hidden) */}
      <input
        ref={(el) => { fileInputRef.current = el; }}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image or empty state */}
      {hasPhoto ? (
        <Image
          src={previewUrl!}
          alt="Selected profile photo"
          fill
          className={["object-cover", imageClassName].join(" ")}
          sizes="(max-width: 640px) 300px, 400px"
          priority
        />
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="absolute inset-0 grid place-items-center"
          aria-label="Add photo"
        />
      )}

      {/* Floating action morph (Plus -> Cancel) */}
      <div className="pointer-events-none absolute right-[-0.5rem] top-[-0.5rem] p-4">
        <AnimatePresence mode="wait" initial={false}>
          {!hasPhoto ? (
            <motion.div
              key="plus"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-auto cursor-pointer"
              onClick={openPicker}
            >
              <PlusButton />
            </motion.div>
          ) : (
            <motion.div
              key="cancel"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-auto"
            >
              <SmallCancelButton onClick={onRemove} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
