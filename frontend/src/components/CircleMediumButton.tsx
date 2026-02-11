"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";

export default function CircleMediumButton({
  href,
  icon,
  label,
  className = "",
  style,
  bgColor = "#FFFFFF",    // default white
  textColor = "#FFFFFF",  // default white
  disabled = false,
  onClick,                // <-- NEW (optional)
}: {
  href: string;
  icon: string;            // e.g. "/location.svg"
  label: string;           // e.g. "Retry"
  className?: string;
  style?: CSSProperties;
  bgColor?: string;
  textColor?: string;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void; // <-- NEW
}) {
  const content = (
    <>
      <div
        className="grid place-items-center rounded-full shadow-md"
        style={{
          width: 60,
          height: 60,
          backgroundColor: bgColor,
        }}
      >
        <Image src={icon} alt="" width={24} height={24} />
      </div>
      <span
        className="text-sm tracking-wide"
        style={{ color: textColor }}
      >
        {label.toUpperCase()}
      </span>
    </>
  );

  if (disabled) {
    return (
      <div
        aria-label={label}
        aria-disabled="true"
        role="button"
        className={[
          "pointer-events-none flex flex-col items-center gap-2 select-none",
          "opacity-50 cursor-not-allowed ",
          className,
        ].join(" ")}
        style={style}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href || "#"}
      aria-label={label}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault(); // stay on the page
          onClick(e);
        }
      }}
      className={[
        "pointer-events-auto flex flex-col items-center gap-2 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60 text-center",
        className,
      ].join(" ")}
      style={style}
    >
      {content}
    </Link>
  );
}
