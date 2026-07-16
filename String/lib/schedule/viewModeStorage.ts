import AsyncStorage from "@react-native-async-storage/async-storage";

export type ScheduleViewMode = "day" | "all";

const VIEW_MODE_KEY = "schedule:viewMode";

export async function loadScheduleViewMode(): Promise<ScheduleViewMode> {
  try {
    const raw = await AsyncStorage.getItem(VIEW_MODE_KEY);
    if (raw === "day" || raw === "all") {
      return raw;
    }
  } catch {
    // ignore
  }
  return "day";
}

export async function saveScheduleViewMode(mode: ScheduleViewMode): Promise<void> {
  await AsyncStorage.setItem(VIEW_MODE_KEY, mode);
}
