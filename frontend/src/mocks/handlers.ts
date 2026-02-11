import { http, HttpResponse } from "msw";
import { v4 as uuid } from "uuid";

let decks: Record<string, { cards: any[] }> = {};

function makeCards(n: number) {
  return Array.from({ length: n }).map((_, i) => ({
    id: uuid(),
    name: `Player ${i + 1}`,
    age: 20 + (i % 10),
    role: i % 2 ? "Coach" : "Player",
    photo: "/placeholder.jpg",
    bio: "I love tennis.",
  }));
}

export const handlers = [
  // GET /v1/decks?size=25
  http.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/decks`, ({ request }) => {
    const url = new URL(request.url);
    const size = Number(url.searchParams.get("size") ?? 25);
    const deckToken = uuid();
    const cards = makeCards(size);
    decks[deckToken] = { cards: [...cards] };
    return HttpResponse.json({ deckToken, cards, ttlMs: 10 * 60_000 });
  }),

  // POST /v1/decks/:token/refill?min_remaining=5
  http.post(`${process.env.NEXT_PUBLIC_API_URL}/v1/decks/:token/refill`, ({ params }) => {
    const token = params.token as string;
    if (!decks[token]) return new HttpResponse(null, { status: 410 }); // expired
    // Return a few more
    const cards = makeCards(8);
    decks[token].cards.push(...cards);
    return HttpResponse.json({ cards });
  }),

  // POST /v1/decisions
  http.post(`${process.env.NEXT_PUBLIC_API_URL}/v1/decisions`, async ({ request }) => {
    const body = await request.json() as any;
    // minimal validation
    if (!body?.deck_token || !Array.isArray(body?.items)) {
      return new HttpResponse(JSON.stringify({ error: "bad body" }), { status: 400 });
    }
    // pretend success; real server would verify membership + idempotency
    return new HttpResponse(null, { status: 204 });
  }),
];
