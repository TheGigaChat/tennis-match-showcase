// src/lib/api/conversations.ts
import { apiFetch } from "@/lib/cookies";

/** Backend DTO for conversation list */
export type ConversationListDto = {
    id: number;
    status: "ACTIVE" | "EXPIRED" | "ARCHIVED" | "DELETED";
    lastMessageAt: string; // ISO
    partner: { userId: number; name?: string; avatarUrl?: string };
    unreadCount: number;   // MVP: 0
};

/** Convenience type for MessagesPage (if you want to map directly to UI) */
export type ChatSummary = {
    id: string; // conversationId as string
    partner: { id: string; name?: string; photo?: string };
    unreadCount: number;
    status: ConversationListDto["status"];
    lastMessageAt: string;
};

/** Mapper: DTO -> UI chat list model */
export function toChatSummary(dto: ConversationListDto): ChatSummary {
    return {
        id: String(dto.id),
        partner: {
            id: String(dto.partner.userId),
            name: dto.partner.name ?? `Player ${dto.partner.userId}`, // default fallback
            photo: dto.partner.avatarUrl || undefined,
        },
        unreadCount: dto.unreadCount ?? 0,
        status: dto.status,
        lastMessageAt: dto.lastMessageAt,
    };
}

/** GET /api/me/conversations — list my conversations */
export async function fetchMyConversations(): Promise<ConversationListDto[]> {
    const res = await apiFetch("/me/conversations", {
        method: "GET",
        // Accept is set inside apiFetch
    });
    if (!res.ok) throw new Error(`fetchMyConversations failed: ${res.status}`);
    return (await res.json()) as ConversationListDto[];
}

/** POST /api/conversations/by-match/{matchId}?userA=&userB= — create chat by match (if not already) */
export async function createConversationByMatch(
    matchId: number,
    userA: number,
    userB: number
): Promise<number> {
    const res = await apiFetch(`/conversations/by-match/${matchId}?userA=${userA}&userB=${userB}`, {
        method: "POST",
    });
    if (!res.ok) throw new Error(`createConversationByMatch failed: ${res.status}`);
    const id = await res.json();
    return typeof id === "number" ? id : Number(id);
}

export type ConversationDetailsDto = {
    id: number;
    status: "ACTIVE" | "EXPIRED" | "ARCHIVED" | "DELETED";
    lastMessageAt: string;
    partner: { userId: number; name?: string; avatarUrl?: string };
};

export async function fetchConversationMeta(chatId: string): Promise<ConversationDetailsDto> {
    const res = await apiFetch(`/me/conversations/${chatId}`, { method: "GET" });
    if (!res.ok) throw new Error(`fetchConversationMeta failed: ${res.status}`);
    return (await res.json()) as ConversationDetailsDto;
}
