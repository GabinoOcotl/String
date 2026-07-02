import { workerFetch } from "@/lib/api/workerClient";

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  text: string;
  created_at: string;
  sender_name: string;
  is_own: boolean;
}

export async function getMessages(
  roomId: string,
  accessToken: string,
): Promise<ChatMessage[]> {
  return workerFetch<ChatMessage[]>(`/messages/${encodeURIComponent(roomId)}`, {
    accessToken,
  });
}

export async function sendMessage(
  roomId: string,
  text: string,
  accessToken: string,
): Promise<ChatMessage> {
  return workerFetch<ChatMessage>("/messages", {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, text }),
  });
}
