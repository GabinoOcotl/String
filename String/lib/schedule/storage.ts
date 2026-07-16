import AsyncStorage from "@react-native-async-storage/async-storage";

import { migrateScheduleClasses } from "@/lib/schedule/meetingDays";
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

    const { classes, changed } = migrateScheduleClasses(
      parsed as Array<Partial<ScheduleClass> & Pick<ScheduleClass, "id">>,
    );

    if (changed) {
      await AsyncStorage.setItem(storageKey(userId), JSON.stringify(classes));
    }

    return classes;
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
