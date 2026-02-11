// app/messages/[chatId]/page.tsx
"use client";

import Link from "next/link";
import React, { use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Virtuoso } from "react-virtuoso";

import ChatHeader from "@/components/chat/ChatHeader";
import ChatFooter from "@/components/chat/ChatFooter";
import BottomNav from "@/components/BottomNav";
import LoadingIndicator from "@/components/LoadingIndicator";

import {
  fetchHistory,
  sendMessageRest,
  toUiMessage,
  type MessageDto,
} from "@/lib/api/messages";
import { fetchConversationMeta } from "@/lib/api/conversations";
import { fetchMeId } from "@/lib/api/me";
import { ChatWs, type WsEvent } from "@/lib/ws/messages-ws";
import { v4 as uuid } from "uuid";
import { convMetaCache } from "@/lib/cache/conversationMetaCache";

type UiMsg = {
  id: string;
  from: "me" | "them";
  text: string;
  sentAt: string;
  _cid?: string; // optimistic marker
};

const devDelayMs = 1000 + Number(process.env.NEXT_PUBLIC_DECK_MOCK_DELAY_MS ?? 0);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Universal wrapper for params (object or Promise)
function unwrapParams<T>(p: T | Promise<T>): T {
  const maybe = p as unknown as { then?: unknown };
  const isPromise = typeof maybe?.then === "function";
  return isPromise ? use(p as Promise<T>) : (p as T);
}

type PageProps =
    | { params: { chatId: string } }
    | { params: Promise<{ chatId: string }> };

export default function ChatPage(props: PageProps) {
  const { chatId } = unwrapParams(props.params);

  const search = useSearchParams();

  // 0) initial name/avatar can be passed via query (?n=, ?a=)
  const initialName = (search.get("n") ?? "").trim();
  const initialAvatar = (search.get("a") ?? "").trim();
  const cached = convMetaCache.get(chatId);

  const [partnerName, setPartnerName] = useState<string>(
      (cached?.name ?? initialName) || "Player"
  );
  const [partnerAvatar, setPartnerAvatar] = useState<string | undefined>(
      cached?.avatar ?? (initialAvatar || undefined)
  );

  const [meId, setMeId] = useState<number | undefined>(undefined);
  const [msgs, setMsgs] = useState<UiMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const baseIndex = 100000;
  const [firstItemIndex, setFirstItemIndex] = useState(baseIndex);
  const pageSize = 50;
  const [androidKeyboardOpen, setAndroidKeyboardOpen] = useState(false);
  const virtuosoRef = useRef<React.ElementRef<typeof Virtuoso> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;

    const updateOffset = () => {
      const bottomInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--keyboard-offset", `${bottomInset}px`);
    };

    updateOffset();
    vv.addEventListener("resize", updateOffset);
    vv.addEventListener("scroll", updateOffset);
    window.addEventListener("orientationchange", updateOffset);

    return () => {
      vv.removeEventListener("resize", updateOffset);
      vv.removeEventListener("scroll", updateOffset);
      window.removeEventListener("orientationchange", updateOffset);
      document.documentElement.style.removeProperty("--keyboard-offset");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const isAndroid = /android/i.test(navigator.userAgent);
    if (!isAndroid) return;
    const vv = window.visualViewport;
    const threshold = 80;

    const handleResize = () => {
      const keyboardOpen = window.innerHeight - vv.height > threshold;
      setAndroidKeyboardOpen(keyboardOpen);
      if (keyboardOpen && msgs.length > 0) {
        virtuosoRef.current?.scrollToIndex({
          index: msgs.length - 1,
          align: "end",
        });
      }
    };

    handleResize();
    vv.addEventListener("resize", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
    };
  }, [msgs.length]);

  // One WS client per page
  const ws = useMemo(() => new ChatWs(), []);

  // A) conversation metadata (partner name and avatar)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta = await fetchConversationMeta(chatId);
        if (cancelled) return;
        const name =
            (meta.partner.name && meta.partner.name.trim()) ||
            `Player ${meta.partner.userId}`;
        const avatar = meta.partner.avatarUrl || undefined;

        convMetaCache.set(chatId, { name, avatar }); // cache on client
        setPartnerName(name);
        setPartnerAvatar(avatar);
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  // B) resolve meId
  useEffect(() => {
    (async () => {
      try {
        const id = await fetchMeId();
        setMeId(id);
      } catch {
        // not critical — all messages will be "them"
      }
    })();
  }, []);

  // C) message history
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        if (devDelayMs > 0) await sleep(devDelayMs);
        const hist = await fetchHistory(chatId, { limit: pageSize });
        if (cancelled) return;

        const ui = (hist.items ?? []).map((m) => toUiMessage(m, meId));
        setMsgs(ui);
        setFirstItemIndex(baseIndex);
        setHasMore((hist.items ?? []).length >= pageSize);
      } catch {
        setMsgs([]);
        setFirstItemIndex(baseIndex);
        setHasMore(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId, meId]);

  // D) WS subscription for messages (with dedupe)
  useEffect(() => {
    const cleanup = ws.subscribeConversation(chatId, (evt: WsEvent) => {
      if (evt.kind !== "MESSAGE") return;

      const dto = evt.data as MessageDto;
      const real = toUiMessage(dto, meId);
      const clientId = dto.clientId ?? undefined;
      const isMine =
          dto.senderId === "me" ||
          (typeof dto.senderId === "number" && meId != null && dto.senderId === meId);

      setMsgs((prev) => {
        if (clientId) {
          const i = prev.findIndex((m) => m._cid === clientId);
          if (i >= 0) {
            const clone = [...prev];
            clone[i] = { ...real, id: String(real.id), _cid: clientId };
            return clone;
          }
          return [...prev, { ...real, _cid: clientId }];
        }

        if (isMine) {
          const rev = [...prev].reverse();
          const j = rev.findIndex(
              (m) => m.from === "me" && m.id.startsWith("tmp-") && m.text === real.text
          );
          if (j !== -1) {
            const idx = prev.length - 1 - j;
            const clone = [...prev];
            clone[idx] = { ...real };
            return clone;
          }
        }

        return [...prev, real];
      });

      if (!isMine && ws.isConnected()) {
        void ws.read(chatId, dto.id);
      }
    });

    return typeof cleanup === "function" ? cleanup : () => {};
  }, [chatId, ws, meId]);

  // Auto-scroll to bottom on message updates
  // Optimistic append
  function appendOptimistic(text: string, clientId: string) {
    setMsgs((prev) => [
      ...prev,
      {
        id: `tmp-${clientId}`,
        _cid: clientId,
        from: "me",
        text,
        sentAt: new Date().toISOString(),
      },
    ]);
  }

  // Send: WS with REST fallback
  async function handleSend(text: string) {
    const cid = uuid();
    appendOptimistic(text, cid);

    try {
      if (ws.isConnected()) {
        await ws.send(chatId, text, cid);
      } else {
        const sent = await sendMessageRest(chatId, text, { clientId: cid });
        const real = toUiMessage(sent, meId);
        setMsgs((prev) => {
          const i = prev.findIndex((m) => m._cid === cid);
          if (i >= 0) {
            const clone = [...prev];
            clone[i] = { ...real, _cid: cid };
            return clone;
          }
          return [...prev, { ...real, _cid: cid }];
        });
      }
    } catch {
      setMsgs((prev) => prev.filter((m) => m._cid !== cid));
    }
  }

  async function loadOlder() {
    if (loadingMore || !hasMore || msgs.length === 0) return;
    const oldest = msgs[0];
    const beforeId = Number(oldest.id);
    if (!Number.isFinite(beforeId)) {
      setHasMore(false);
      return;
    }
    setLoadingMore(true);
    try {
      if (devDelayMs > 0) await sleep(devDelayMs);
      const hist = await fetchHistory(chatId, { beforeId, limit: pageSize });
      const items = hist.items ?? [];
      if (items.length === 0) {
        setHasMore(false);
        return;
      }
      const ui = items.map((m) => toUiMessage(m, meId));
      setFirstItemIndex((prev) => prev - ui.length);
      setMsgs((prev) => [...ui, ...prev]);
      if (items.length < pageSize) setHasMore(false);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  const renderBubble = (m: UiMsg) => (
      <div className="pb-1">
        <div className={m.from === "me" ? "flex justify-end" : "flex justify-start"}>
          <span
              className={[
                "inline-block whitespace-pre-wrap break-words leading-snug",
                "rounded-2xl px-4 py-2 text-[15px]",
                "min-w-[90px] max-w-[180px]",
                m.from === "me"
                    ? "bg-[var(--main-light)] text-[var(--bg)]"
                    : "bg-[var(--neutral-light)] text-[var(--textMain)]",
              ].join(" ")}
          >
            {m.text}
          </span>
        </div>
      </div>
  );

  return (
      <div className="h-dvh bg-bg overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-phone flex-col gap-4 px-4 pt-4">
          {/* App header */}
          <div className="flex items-center justify-center" style={{ minHeight: "clamp(20px, 6vh, 56px)" }}>
            <Link
                href="/"
                style={{ fontSize: "clamp(36px, 4.3vw, 36px)" }}
                className="font-bold text-[var(--main)]"
            >
              TennisMatch
            </Link>
          </div>

          {/* Chat card */}
          <div className="relative flex h-[min(1000px,calc(100dvh-80px-56px-24px))] flex-col rounded-3xl bg-white shadow-lg shadow-black/10">
            <ChatHeader name={partnerName} avatarUrl={partnerAvatar} />

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="relative flex-1 px-3 py-3">
                {loading ? (
                    <div className="grid h-full place-items-center">
                      <LoadingIndicator label="Loading messages..." />
                    </div>
                ) : msgs.length === 0 ? (
                    <div className="grid h-full place-items-center">
                      <p className="max-w-[22rem] text-center text-h3 text-textMain">
                        You have a Match!
                        <br />
                        Send a message to start.
                      </p>
                    </div>
                ) : (
                    <Virtuoso
                      ref={virtuosoRef}
                      data={msgs}
                      alignToBottom
                      firstItemIndex={firstItemIndex}
                      initialTopMostItemIndex={msgs.length - 1}
                      followOutput={(isAtBottom) =>
                        androidKeyboardOpen ? true : isAtBottom
                      }
                      itemContent={(_, m) => renderBubble(m)}
                      startReached={loadOlder}
                      className="chat-scroll"
                      style={{ height: "100%" }}
                    />
                )}
                {!loading && loadingMore ? (
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1/3">
                      <div className="h-full bg-gradient-to-t from-transparent to-white/95" />
                      <div className="absolute left-1/2 top-[24px] -translate-x-1/2">
                        <LoadingIndicator label="Loading messages..." />
                      </div>
                    </div>
                ) : null}
              </div>

              <div className="chat-footer-sticky">
                <ChatFooter onSend={handleSend} />
              </div>
            </div>
          </div>

          {/* Bottom navigation */}
          <BottomNav
            active="messages"
          />
        </div>
      </div>
  );
}
