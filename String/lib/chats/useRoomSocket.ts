import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import type { ChatMessage } from "@/lib/api/messages";
import { workerConfigError } from "@/lib/api/workerClient";

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

type ChatBroadcastEvent = {
  type: "message";
  payload: {
    id: string;
    room_id: string;
    user_id: string;
    text: string;
    created_at: string;
    sender_name: string;
  };
};

export function buildChatWebSocketUrl(
  roomId: string,
  accessToken: string,
): string | null {
  const workerUrl = process.env.EXPO_PUBLIC_WORKER_URL;
  if (!workerUrl) return null;

  const base = workerUrl.replace(/\/$/, "");
  const wsBase = base.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  const path = `/chat/${encodeURIComponent(roomId)}`;

  if (Platform.OS === "web") {
    const url = new URL(`${wsBase}${path}`);
    url.searchParams.set("token", accessToken);
    return url.toString();
  }

  return `${wsBase}${path}`;
}

export type UseRoomSocketOptions = {
  roomId: string | undefined;
  accessToken: string | undefined;
  userId: string | undefined;
  onMessage: (message: ChatMessage) => void;
  enabled?: boolean;
};

export function useRoomSocket({
  roomId,
  accessToken,
  userId,
  onMessage,
  enabled = true,
}: UseRoomSocketOptions): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled || !roomId || !accessToken || workerConfigError) {
      setConnected(false);
      return;
    }

    const url = buildChatWebSocketUrl(roomId, accessToken);
    if (!url) {
      setConnected(false);
      return;
    }

    let ws: WebSocket | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let disposed = false;

    const scheduleReconnect = () => {
      if (disposed) return;
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    const connect = () => {
      if (disposed) return;

      const wsOptions =
        Platform.OS !== "web"
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : undefined;

      ws = new WebSocket(url, undefined, wsOptions);

      ws.onopen = () => {
        if (disposed) return;
        attempt = 0;
        setConnected(true);
      };

      ws.onmessage = (event) => {
        if (disposed) return;

        let data: ChatBroadcastEvent | { type?: string };
        try {
          data = JSON.parse(String(event.data)) as ChatBroadcastEvent;
        } catch {
          return;
        }

        if (data.type !== "message" || !("payload" in data) || !data.payload) {
          return;
        }

        const payload = data.payload;
        onMessageRef.current({
          id: payload.id,
          room_id: payload.room_id,
          user_id: payload.user_id,
          text: payload.text,
          created_at: payload.created_at,
          sender_name: payload.sender_name,
          is_own: userId ? payload.user_id === userId : false,
        });
      };

      ws.onclose = () => {
        if (disposed) return;
        setConnected(false);
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
      setConnected(false);
    };
  }, [roomId, accessToken, userId, enabled]);

  return { connected };
}
