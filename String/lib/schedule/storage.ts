import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ScheduleClass } from "@/lib/schedule/types";

const storageKey = (userId: string) => `schedule:${userId}`;

export async function loadSchedule(userId: string): Promise<ScheduleClass[]> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as ScheduleClass[];
  } catch {
    return [];
  }
}

export async function saveSchedule(
  userId: string,
  classes: ScheduleClass[],
): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(classes));
}
