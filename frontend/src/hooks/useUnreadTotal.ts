"use client";

import { useEffect, useState } from "react";
import { fetchMyConversations } from "@/lib/api/conversations";

const POLL_MS = 10_000;

export function useUnreadTotal(excludeConversationId?: string) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        const list = await fetchMyConversations();
        if (cancelled) return;

        const exclude = excludeConversationId ? String(excludeConversationId) : null;
        let sum = 0;
        for (const convo of list) {
          if (exclude && String(convo.id) === exclude) continue;
          const count = Number(convo.unreadCount ?? 0);
          if (Number.isFinite(count) && count > 0) sum += count;
        }
        setTotal(sum);
      } catch {
        if (!cancelled) setTotal(0);
      }
    };

    void load();
    timer = setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [excludeConversationId]);

  return total;
}
