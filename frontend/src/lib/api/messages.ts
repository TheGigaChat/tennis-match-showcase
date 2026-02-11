// lib/api/messages.ts
import { API, apiFetch} from "@/lib/cookies";

/** ===== Existing (keep your ChatPreview / fetchChats mock etc.) ===== */
export type ChatPreview = {
  chatId: string;
  partner: { userId: string; name: string; avatarUrl?: string };
  unreadCount: number;
};

// … your existing MOCK_CHATS + fetchChats() can stay here for the list

/** ====== REST types that match your backend DTOs (minimal) ====== */
export type MessageDto = {
  id: number | string;
  body: string;
  senderId: number | "me";    // backend may return numeric; some APIs return "me"
  clientId?: string | null;
  createdAt?: string;         // optional (some DTOs use createdAt/sentAt)
  sentAt?: string;
};

export type HistoryResponse = {
  items: MessageDto[];        // your controller returns HistoryResponse
  hasMore?: boolean;          // optional cursor flag
  nextBeforeId?: number;      // optional cursor
};

/** ====== REST wrappers for your controllers ====== */


/** GET /api/conversations/{conversationId}/messages?before_id=&limit= */
export async function fetchHistory(
    conversationId: number | string,
    opts?: { beforeId?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (opts?.beforeId != null) qs.set("before_id", String(opts.beforeId));
  if (opts?.limit != null) qs.set("limit", String(opts.limit));
  const url = `/api/conversations/${conversationId}/messages${qs.size ? `?${qs}` : ""}`;

  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`history failed: ${res.status}`);
  return (await res.json()) as HistoryResponse;
}

/** POST /api/conversations/{conversationId}/messages  (X-User-Id optional) */
export async function sendMessageRest(
    conversationId: number | string,
    body: string,
    options?: { clientId?: string; userIdHeader?: number }
) {
  const res = await apiFetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options?.userIdHeader != null ? { "X-User-Id": String(options.userIdHeader) } : {}),
    },
    body: JSON.stringify({ body, clientId: options?.clientId ?? null }),
  });
  if (!res.ok) throw new Error(`send failed: ${res.status}`);
  return (await res.json()) as MessageDto;
}

/** Small helper: normalize timestamp + who-sent */
export function toUiMessage(m: MessageDto, meId?: number) {
  const ts = m.createdAt ?? m.sentAt ?? new Date().toISOString();
  const mine =
    m.senderId === "me" || (typeof m.senderId === "number" && meId != null && m.senderId === meId);
  return {
    id: String(m.id),
    from: mine ? "me" : "them",
    text: m.body,
    sentAt: ts,
  } as { id: string; from: "me" | "them"; text: string; sentAt: string };
}
