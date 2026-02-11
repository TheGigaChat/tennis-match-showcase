"use client";

export default function ChoiceButton({
  label,
  isActive,
  onClick,
  disabled = false,
  className = "",
}: {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "w-full h-14 rounded-2xl border transition-colors text-h4 font-semibold";

  const state = isActive
    ? "border-main text-main"
    : "border-neutralLight text-neutral hover:border-neutral";

  const disabledStyle = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${state} ${disabledStyle} ${className}`}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
}
