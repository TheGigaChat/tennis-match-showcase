// components/chat/ChatBlock.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export default function ChatBlock({
  chatId,
  name,
  avatarUrl,
  unreadCount,
}: {
  chatId: string;
  name: string;
  avatarUrl?: string;
  unreadCount: number;
}) {
  return (
    <Link
      href={`/messages/${chatId}`}
      className={[
        // row visuals
        "flex items-center justify-between bg-[var(--main)]",
        "h-[90px] px-4",
        // focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60",
      ].join(" ")}
    >
      {/* left: avatar + name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-[60px] w-[60px] overflow-hidden rounded-full bg-white/15 shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={60}
              height={60}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-white/80 text-base">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <span
          className="truncate text-[16px] leading-none text-white"
          title={name}
        >
          {name}
        </span>
      </div>

      {/* right: unread pill (auto width) */}
      {unreadCount > 0 && (
        <span
          className={[
            "grid place-items-center rounded-full",
            "bg-white/100 text-[var(--main)]",
            "text-[16px] leading-none min-w-[28px] h-[28px] px-[10px]",
            "shadow-sm ring-1 ring-white/15",
          ].join(" ")}
        >
          {unreadCount}
        </span>
      )}
    </Link>
  );
}
