"use client";
import type { MessageDto } from "@/lib/api/messages";

// If backend uses .withSockJS(), install: npm i sockjs-client
// const USE_SOCKJS = true; // ← TRUE if WsConfig has .withSockJS()

export type WsEvent =
    | { kind: "MESSAGE"; data: MessageDto }
    | { kind: "TYPING"; data: any }
    | { kind: "READ"; data: any };

type StompClient = import("@stomp/stompjs").Client;
type IMessage = import("@stomp/stompjs").IMessage;
type StompSubscription = import("@stomp/stompjs").StompSubscription;

export class ChatWs {
    private client: StompClient | null = null;
    private connected = false;
    private wsUrl: string;

    constructor(wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws") {
        this.wsUrl = wsUrl;
        void this.ensureClient(); // lazy-init the client
    }

    private async ensureClient() {
        if (this.client) return this.client;

        const { Client } = await import("@stomp/stompjs");

        const client = new Client({
            reconnectDelay: 1500,
            debug: () => {},
        });


        client.brokerURL = this.wsUrl; // plain WS


        client.onConnect = () => { this.connected = true; };
        client.onWebSocketClose = () => { this.connected = false; };

        this.client = client;
        client.activate();
        return client;
    }

    /** Synchronous subscribe: returns a cleanup function;
     *  if not connected yet — waits for onConnect and subscribes.
     */
    subscribeConversation(convId: string | number, onEvent: (e: WsEvent) => void) {
        let sub: StompSubscription | null = null;
        let canceled = false;

        const dest = `/topic/conversations.${convId}`;
        const handler = (msg: IMessage) => {
            try { onEvent(JSON.parse(msg.body)); } catch {}
        };

        const doSubscribe = () => {
            if (canceled || !this.client) return;
            if (!this.client.connected) return;
            sub = this.client.subscribe(dest, handler);
        };

        // Ensure client is ready
        void this.ensureClient().then(() => {
            if (!this.client) return;
            if (this.client.connected) {
                doSubscribe();
            } else {
                // Subscribe once on first connect
                const prev = this.client.onConnect;
                this.client.onConnect = (frame) => {
                    prev?.(frame);
                    doSubscribe();
                };
            }
        });

        // Synchronous cleanup
        return () => { canceled = true; sub?.unsubscribe(); };
    }

    /** Send after client is ready */
    async send(convId: string | number, body: string, clientId?: string) {
        await this.ensureClient();
        if (!this.client) throw new Error("WS client not ready");
        this.client.publish({
            destination: `/app/chat.${convId}.send`,
            body: JSON.stringify({ body, clientId }),
        });
    }

    async read(convId: string | number, lastSeenId?: string | number) {
        await this.ensureClient();
        if (!this.client) throw new Error("WS client not ready");
        this.client.publish({
            destination: `/app/chat.${convId}.read`,
            body: JSON.stringify({ lastSeenId: lastSeenId ?? null }),
        });
    }

    isConnected() { return this.client?.connected ?? false; }
}
