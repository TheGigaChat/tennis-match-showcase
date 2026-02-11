"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMyConversations, toChatSummary } from "@/lib/api/conversations";
import type { ChatSummary } from "@/lib/api/conversations";
import ChatBlock from "@/components/chat/ChatBlock";

import CircleMediumButton from "@/components/CircleMediumButton";
import BottomNav from "@/components/BottomNav";


export default function MessagesPage() {
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const list = await fetchMyConversations();
        setChats(list.map(c => toChatSummary(c)));
      } catch (err: any) {
        const msg = typeof err?.message === "string" ? err.message : "";
        if (msg.includes("401") || msg.includes("403") || msg.includes("Failed to fetch")) {
          window.location.href = "/registration";
          return;
        }
        setChats([]);
      } finally {
        setIsLoading(false);
      }

    })();
  }, []);

  const showEmpty = !isLoading && chats && chats.length === 0;

  return (
    <div className="h-dvh bg-bg overflow-hidden">
      <div className="mx-auto w-full max-w-phone px-4 pt-4 flex h-full flex-col gap-4">
        {/* header (same as profile) */}
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "clamp(20px, 6vh, 56px)" }}
        >
          <Link
            href="/"
            style={{ fontSize: "clamp(36px, 4.3vw, 36px)" }}
            className="font-bold text-[var(--main)]"
          >
            TennisMatch
          </Link>
        </div>

        {/* card area */}
        <div className="relative z-[5] flex-1 min-h-0 overflow-visible">
          <div
            className="relative mx-auto w-full max-w-phone grid place-items-center"
            style={{
              height: "min(1000px, calc(100dvh - 80px - 56px - 24px))",
            }}
          >
            <div className="absolute inset-0 rounded-3xl bg-white shadow-lg shadow-black/10 overflow-hidden">
              <div className="h-full">
                {/* Loading */}
                {isLoading && (
                  <div className="h-full w-full rounded-3xl bg-neutral/10 animate-pulse" />
                )}

                {/* Empty state */}
                {showEmpty && (
                  <div className="h-full w-full grid place-items-center">
                    <CircleMediumButton
                      href="/discover"
                      // use any group/people icon you have; swap the path if needed
                      icon="/messages-discover.svg"
                      label="Discover a match partner"
                      bgColor="var(--main)"
                      textColor="var(--main)"
                    />
                  </div>
                )}

                {/* Chats list */}
                {!isLoading && chats && chats.length > 0 && (
                  <div className="h-full">
                    {/* Rounded list container; handles top/bottom rounding */}
                    <div className="h-full overflow-hidden rounded-3xl">
                      <ul className="h-full overflow-y-auto divide-y divide-white/12">
                        {chats.map((c) => (
                          <li key={c.id} className="bg-[var(--main)]">
                            <ChatBlock
                              chatId={c.id}
                              name={c.partner.name ?? "Player"}
                              avatarUrl={c.partner.photo}
                              unreadCount={c.unreadCount}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* bottom nav (same as profile, messages active) */}
        <BottomNav active="messages" />
      </div>
    </div>
  );
}

function ChatListItem({
                        chatId,
                        name,
                        photo,
                        unread,
                        withDivider,
                      }: {
  chatId: string;
  name?: string;
  photo?: string;
  unread: number;
  withDivider?: boolean;
}) {
  const displayName = name && name.trim() ? name : "Player";
  const initial = displayName.slice(0, 1).toUpperCase();
  const hasPhoto = !!(photo && photo.trim());

  return (
      <Link
          href={`/messages/${chatId}`}
          className={[
            "flex items-center gap-3 px-3 py-2",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60",
            withDivider ? "border-b border-white/15" : "",
          ].join(" ")}
      >
        <div className="h-9 w-9 rounded-full overflow-hidden bg-white/20 shrink-0">
          {hasPhoto ? (
              <Image src={photo!} alt="" width={36} height={36} className="h-full w-full object-cover" />
          ) : (
              <div className="h-full w-full grid place-items-center text-white/80 text-sm">
                {initial}
              </div>
          )}
        </div>

        <div className="flex-1 text-white text-[15px]">{displayName}</div>

        {unread > 0 && (
            <span className="ml-2 grid place-items-center rounded-full bg-white/90 text-[var(--main)] text-xs font-semibold min-w-6 h-6 px-2">
          {unread}
        </span>
        )}
      </Link>
  );
}

