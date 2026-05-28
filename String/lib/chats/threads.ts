export const PLACEHOLDER_THREADS = [
  { id: "calc-101", className: "Calculus I", lastMessage: "See you at review session" },
  { id: "cs-220", className: "Data Structures", lastMessage: "Project groups posted" },
] as const;

export type ChatThread = (typeof PLACEHOLDER_THREADS)[number];

export async function fetchChatThreads(): Promise<ChatThread[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return [...PLACEHOLDER_THREADS];
}

export function getThreadTitle(threadId: string | undefined): string {
  const thread = PLACEHOLDER_THREADS.find((t) => t.id === threadId);
  return thread?.className ?? "Chat";
}
