"use client";

type Props = {
  label?: string;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
};

export default function ContinueButton({
  label = "Continue",
  className = "",
  disabled = false,
  type = "button",
  onClick,
}: Props) {
  const base =
    "w-full h-12 rounded-xl text-base font-semibold shadow-sm transition";
  const enabled = "bg-main text-white hover:brightness-95";
  const disabledCls = "bg-neutralLight text-white cursor-not-allowed";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`${base} ${disabled ? disabledCls : enabled} ${className}`}
    >
      {label}
    </button>
  );
}
