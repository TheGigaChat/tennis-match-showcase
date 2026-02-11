"use client";

export default function PlusButton({ className = "" }: { className?: string }) {
  return (
    <div
      className={
        "flex h-12 w-12 items-center justify-center rounded-full bg-main text-white " +
        className
      }
      aria-hidden="true"
    >
      {/* plus */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
