import { getMyRooms, type RoomThread } from "@/lib/api/rooms";

export type ChatThread = {
  id: string;
  className: string;
  lastMessage: string;
};

function mapRoomToThread(room: RoomThread): ChatThread {
  return {
    id: room.id,
    className: room.name,
    lastMessage: room.lastMessage ?? "No messages yet",
  };
}

export async function fetchChatThreads(accessToken: string): Promise<ChatThread[]> {
  const rooms = await getMyRooms(accessToken);
  return rooms.map(mapRoomToThread);
}

export function getThreadTitle(_threadId: string | undefined, name?: string): string {
  const trimmed = name?.trim();
  return trimmed || "Chat";
}
