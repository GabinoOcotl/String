import { getMyRooms, type RoomThread } from "@/lib/api/rooms";
import { formatChatThreadTitle } from "@/lib/schedule/mapSections";
import type { ScheduleClass } from "@/lib/schedule/types";

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

export function getThreadTitle(
  _threadId: string | undefined,
  name?: string,
  lectureSectionNumber?: string,
  discussionSectionNumber?: string,
): string {
  const trimmed = name?.trim();

  if (lectureSectionNumber || discussionSectionNumber) {
    return formatChatThreadTitle(
      trimmed || "Chat",
      lectureSectionNumber,
      discussionSectionNumber,
    );
  }

  return trimmed || "Chat";
}

export function resolveThreadTitle(
  threadId: string | undefined,
  roomName: string | undefined,
  scheduleClasses: ScheduleClass[],
): string {
  if (!threadId) {
    return getThreadTitle(threadId, roomName);
  }

  const klass = scheduleClasses.find((entry) => entry.id === threadId);
  if (klass) {
    return formatChatThreadTitle(
      klass.name,
      klass.lectureSectionNumber,
      klass.discussionSectionNumber,
    );
  }

  return getThreadTitle(threadId, roomName);
}
