import { apiFetch } from "@/lib/cookies";
export async function fetchMeId(): Promise<number> {
    const res = await apiFetch("/api/whoami", { method: "GET" });
    const data = await res.json() as { userId: number };
    return data.userId;
}