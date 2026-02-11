"use client";

export default function SmallCancelButton({
  onClick,
  className = "",
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove photo"
      className={
        "flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow " +
        "active:scale-95 transition " + className
      }
    >
      {/* X */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
