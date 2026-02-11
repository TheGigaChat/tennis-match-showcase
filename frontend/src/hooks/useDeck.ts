// hooks/useDeck.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Decision, DeckToken, MatchSummary, getDeck, postDecision } from "@/lib/deckApi";

const HAND_SIZE = 20;  // hardcode the maximum of 20, then you must refresh the page
const RESERVE_REFILL_THRESHOLD = 5;
const MOCK_LOADING_DELAY_MS = Number(process.env.NEXT_PUBLIC_DECK_MOCK_DELAY_MS ?? 0);

type Leaving = null | "left" | "right";
type CardWithToken = Card & { deckToken: DeckToken };

export function useDeck() {
  const [hand, setHand] = useState<CardWithToken[]>([]);
  const [reserve, setReserve] = useState<CardWithToken[]>([]);
  const [leaving, setLeaving] = useState<Leaving>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [match, setMatch] = useState<MatchSummary | null>(null);
  const hasSwipedRef = useRef(false);
  const handRef = useRef<CardWithToken[]>([]);
  const reserveRef = useRef<CardWithToken[]>([]);
  const excludedTargetIdsRef = useRef<Set<number>>(new Set());

  // Single "mutex" for network requests
  const inflight = useRef<AbortController | null>(null);
  const isFetching = () => inflight.current !== null;

  const top = hand[0] ?? null;
  const peek = hand[1] ?? null;

  useEffect(() => {
    handRef.current = hand;
  }, [hand]);

  useEffect(() => {
    reserveRef.current = reserve;
  }, [reserve]);

  const getKnownTargetIds = useCallback(() => {
    const ids = new Set<number>();
    for (const card of handRef.current) ids.add(card.targetId);
    for (const card of reserveRef.current) ids.add(card.targetId);
    for (const id of excludedTargetIdsRef.current) ids.add(id);
    return ids;
  }, []);

  const dedupeIncoming = useCallback((incoming: CardWithToken[], known: Set<number>) => {
    const unique: CardWithToken[] = [];
    let dropped = 0;
    for (const card of incoming) {
      if (known.has(card.targetId)) {
        dropped += 1;
        continue;
      }
      known.add(card.targetId);
      unique.push(card);
    }
    return { unique, dropped };
  }, []);

  // Initialize the first deck
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (isFetching()) return; // guard against double-mounting in dev
      const controller = new AbortController();
      inflight.current = controller;

      try {
        setIsLoading(true);
        const deckResp = await getDeck(controller.signal);
        if (cancelled) return;
        if (MOCK_LOADING_DELAY_MS > 0) {
          await new Promise((resolve) => setTimeout(resolve, MOCK_LOADING_DELAY_MS));
        }

        const withToken: CardWithToken[] = deckResp.cards.map((c) => ({
          ...c,
          deckToken: deckResp.deckToken,
        }));
        const initialKnown = new Set<number>();
        const { unique } = dedupeIncoming(withToken, initialKnown);
        const first = unique.slice(0, HAND_SIZE);
        const rest = unique.slice(HAND_SIZE);
        setHand(first);
        setReserve(rest);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          const msg = typeof e?.message === "string" ? e.message : "";
          if (msg.includes("401") || msg.includes("403") || msg.includes("Failed to fetch")) {
            window.location.href = "/registration";
            return;
          }
        }
      } finally {
        if (inflight.current === controller) inflight.current = null;
        if (!cancelled) setIsLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      inflight.current?.abort();
      inflight.current = null;
    };
  }, []);

  // Keep the hand full using the local reserve
  useEffect(() => {
    if (hand.length < HAND_SIZE && reserve.length > 0) {
      setHand((h) => {
        const need = HAND_SIZE - h.length;
        const take = reserve.slice(0, need);
        setReserve((r) => r.slice(need));
        return [...h, ...take];
      });
    }
  }, [reserve.length, hand.length]);

  // Fetch a new deck when the reserve is low
  const fetchRefillOrNewDeck = useCallback(async () => {
    if (isFetching()) return;
    const controller = new AbortController();
    inflight.current = controller;

    try {
      const deckResp = await getDeck(controller.signal);
      const withToken: CardWithToken[] = deckResp.cards.map((c) => ({
        ...c,
        deckToken: deckResp.deckToken,
      }));
      const known = getKnownTargetIds();
      const { unique } = dedupeIncoming(withToken, known);
      setReserve((r) => [...r, ...unique]);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        const msg = typeof e?.message === "string" ? e.message : "";
        if (msg.includes("401") || msg.includes("403") || msg.includes("Failed to fetch")) {
          window.location.href = "/registration";
          return;
        }
      }
    } finally {
      if (inflight.current === controller) inflight.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hasSwiped) return;
    if (reserve.length <= RESERVE_REFILL_THRESHOLD && !isFetching()) {
      fetchRefillOrNewDeck();
    }
  }, [reserve.length, fetchRefillOrNewDeck, hasSwiped]);

  // Swipe (YES/NOPE) — send ONLY the card's token
  const swipe = useCallback(
      async (direction: "left" | "right") => {
        if (!top || leaving) return;
        if (!hasSwipedRef.current) {
          hasSwipedRef.current = true;
          setHasSwiped(true);
        }
        setLeaving(direction);

        const swipedCard = top;
        excludedTargetIdsRef.current.add(swipedCard.targetId);
        const decision: Decision = direction === "right" ? "YES" : "NOPE";
        const idempotencyKey =
            crypto?.randomUUID?.() ?? `${swipedCard.id}-${Date.now()}`;

        // Optimistically remove the card from hand
        setTimeout(() => {
          const targetId = swipedCard.targetId;
          setHand((h) => h.filter((c) => c.targetId !== targetId));
          setReserve((r) => r.filter((c) => c.targetId !== targetId));
          setLeaving(null);
        }, 300);

        // IMPORTANT: send the deckToken that owns this card
        postDecision({
          deckToken: swipedCard.deckToken,
          cardId: swipedCard.id,
          decision,
          idempotencyKey,
        })
          .then((resp) => {
            const result = resp?.results?.[0];
            if (result?.matched && result.match) {
              setMatch(result.match);
            }
          })
          .catch(() => {});
      },
      [top, leaving]
  );

  const like = useCallback(() => swipe("right"), [swipe]);
  const nope = useCallback(() => swipe("left"), [swipe]);

  const clearMatch = useCallback(() => setMatch(null), []);

  return { hand, top, peek, leaving, like, nope, isLoading, match, clearMatch };
}
