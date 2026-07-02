import { workerFetch } from "@/lib/api/workerClient";

export interface JoinSectionRoomPayload {
  subjectCode: string;
  courseId: string;
  enrollmentClassNumber: number;
  courseDesignation: string;
}

export interface JoinSectionRoomResult {
  roomId: string;
  name: string;
  joined: true;
}

export interface RoomThread {
  id: string;
  name: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export async function joinSectionRoom(
  payload: JoinSectionRoomPayload,
  accessToken: string,
): Promise<JoinSectionRoomResult> {
  return workerFetch<JoinSectionRoomResult>("/rooms/join", {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getMyRooms(accessToken: string): Promise<RoomThread[]> {
  return workerFetch<RoomThread[]>("/rooms", { accessToken });
}
