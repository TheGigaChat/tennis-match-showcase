// lib/deckApi.ts
import { apiFetch } from "@/lib/cookies";
import { toSkillLabel } from "@/lib/skillLevels";

export type DeckToken = string;

export type Card = {
  id: string;
  targetId: number;
  name: string;
  age: number;
  skillLevel: string;
  distanceKm?: number;
  photo: string;
  bio?: string;
};

export type GetDeckResponse = {
  deckToken: DeckToken;
  cards: Card[];
  ttlMs?: number;
};

export async function getDeck(abort?: AbortSignal): Promise<GetDeckResponse> {
  const res = await apiFetch(`/me/deck`, {
    method: "GET",
    signal: abort,
  });
  if (!res.ok) throw new Error(`getDeck failed: ${res.status}`);
  const data = await res.json().catch(() => null);
  if (!data || !Array.isArray(data.cards)) return data;
  return {
    ...data,
    cards: data.cards.map((card: Card) => ({
      ...card,
      skillLevel: toSkillLabel(card?.skillLevel),
    })),
  };
}

export type Decision = "YES" | "NOPE";

export type MatchSummary = {
  matchId: number;
  conversationId: number;
  name?: string | null;
  age?: number | null;
  photoUrl?: string | null;
};

export type DecisionResult = {
  candidateId: string;
  targetUserId: number;
  matched: boolean;
  match?: MatchSummary | null;
};

export type PostDecisionResponse = {
  results: DecisionResult[];
};

export async function postDecision(args: {
  deckToken: DeckToken;
  cardId: string;
  decision: Decision;
  at?: string; // ISO timestamp
  idempotencyKey?: string;
  abort?: AbortSignal;
}): Promise<PostDecisionResponse> {
  const { deckToken, cardId, decision, at, idempotencyKey, abort } = args;

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });
  if (idempotencyKey) {
    // Both variants are usually allowed by CORS; keep canonical-case
    headers.set("Idempotency-Key", idempotencyKey);
  }

  const res = await apiFetch(`/me/decision`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      deck_token: deckToken,
      items: [
        {
          candidate_id: cardId,
          decision,
          at: at ?? new Date().toISOString(),
          position: 0,
          idempotency_key: idempotencyKey,
        },
      ],
    }),
    signal: abort,
  });

  if (!res.ok) throw new Error(`postDecision failed: ${res.status}`);
  if (res.status === 204) return { results: [] };
  const data = await res.json().catch(() => null);
  if (!data) return { results: [] };
  return data;
}

/** Optional: ask server for a top-up when reserve is low */
// export async function refillDeck(deckToken: DeckToken, minRemaining = 5, abort?: AbortSignal): Promise<Card[]> {
//   const res = await fetch(`${API}/v1/decks/${encodeURIComponent(deckToken)}/refill?min_remaining=${minRemaining}`, {
//     method: "POST",
//     credentials: "include",
//     headers: { Accept: "application/json" },
//     signal: abort,
//   });
//   if (res.status === 404 || res.status === 410) return []; // token invalid/expired
//   if (!res.ok) throw new Error(`refillDeck failed: ${res.status}`);
//   const data = await res.json().catch(() => null);
//   return Array.isArray(data?.cards) ? data.cards : [];
// }
