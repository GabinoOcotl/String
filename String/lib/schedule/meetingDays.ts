import type { ClassMeeting } from "@/lib/api/types/enrollment";
import type { ScheduleClass } from "@/lib/schedule/types";

/** JS `Date.getDay()` indices: 0=Sun … 6=Sat */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Mon→Fri order for the Day-mode strip (no weekend classes). */
export const WEEKDAY_STRIP_ORDER: WeekdayIndex[] = [1, 2, 3, 4, 5];

/** UW compact day codes → JS weekday index. */
const UW_DAY_CODE: Record<string, WeekdayIndex> = {
  U: 0,
  N: 0,
  M: 1,
  T: 2,
  W: 3,
  R: 4,
  F: 5,
  S: 6,
};

const DAY_NAME_TO_INDEX: Record<string, WeekdayIndex> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const FLAG_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function uniqueSorted(days: number[]): WeekdayIndex[] {
  return [...new Set(days.filter((d): d is WeekdayIndex => d >= 0 && d <= 6))].sort(
    (a, b) => a - b,
  );
}

/** Parse UW compact codes such as `"TR"` or `"MWF"`. */
export function parseMeetingWeekdays(
  meetingDays: string | null | undefined,
): WeekdayIndex[] {
  if (!meetingDays?.trim()) {
    return [];
  }

  const days: WeekdayIndex[] = [];
  for (const char of meetingDays.trim().toUpperCase()) {
    const index = UW_DAY_CODE[char];
    if (index != null) {
      days.push(index);
    }
  }
  return uniqueSorted(days);
}

function weekdaysFromFlags(meeting: ClassMeeting): WeekdayIndex[] {
  const days: WeekdayIndex[] = [];
  for (let i = 0; i < FLAG_KEYS.length; i++) {
    const key = FLAG_KEYS[i];
    if (meeting[key] === true) {
      days.push(i as WeekdayIndex);
    }
  }
  return uniqueSorted(days);
}

function weekdaysFromList(list: unknown): WeekdayIndex[] {
  if (!Array.isArray(list)) {
    return [];
  }

  const days: WeekdayIndex[] = [];
  for (const entry of list) {
    if (typeof entry !== "string") {
      continue;
    }
    const index = DAY_NAME_TO_INDEX[entry.trim().toUpperCase()];
    if (index != null) {
      days.push(index);
    }
  }
  return uniqueSorted(days);
}

/**
 * Prefer API weekday booleans / `meetingDaysList`, then fall back to compact
 * `meetingDays` codes (`M`/`T`/`W`/`R`/`F`/`S`/`U`/`N`).
 */
export function parseMeetingWeekdaysFromMeeting(
  meeting: ClassMeeting | null | undefined,
): WeekdayIndex[] {
  if (!meeting) {
    return [];
  }

  const fromFlags = weekdaysFromFlags(meeting);
  if (fromFlags.length > 0) {
    return fromFlags;
  }

  const fromList = weekdaysFromList(meeting.meetingDaysList);
  if (fromList.length > 0) {
    return fromList;
  }

  return parseMeetingWeekdays(meeting.meetingDays);
}

export function classMeetsOnWeekday(
  klass: ScheduleClass,
  weekday: number,
): boolean {
  const days = klass.meetingWeekdays ?? [];
  return days.includes(weekday as WeekdayIndex);
}

/** Classes that meet on `weekday`, sorted by start time. Missing days → excluded. */
export function classesForWeekday(
  classes: ScheduleClass[],
  weekday: number,
): ScheduleClass[] {
  return classes
    .filter((klass) => classMeetsOnWeekday(klass, weekday))
    .sort(compareByMeetingTime);
}

export function compareByMeetingTime(a: ScheduleClass, b: ScheduleClass): number {
  const aMs = a.meetingTimeStartMs;
  const bMs = b.meetingTimeStartMs;
  if (aMs != null && bMs != null && aMs !== bMs) {
    return aMs - bMs;
  }
  if (aMs != null && bMs == null) {
    return -1;
  }
  if (aMs == null && bMs != null) {
    return 1;
  }
  return a.name.localeCompare(b.name);
}

/** All-mode sort: course name, then start time. */
export function compareByNameThenTime(a: ScheduleClass, b: ScheduleClass): number {
  const byName = a.name.localeCompare(b.name);
  if (byName !== 0) {
    return byName;
  }
  return compareByMeetingTime(a, b);
}

export function weekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekday as WeekdayIndex] ?? "Unknown";
}

export function weekdayShortName(weekday: number): string {
  return WEEKDAY_SHORT[weekday as WeekdayIndex] ?? "?";
}

export function todayWeekday(): WeekdayIndex {
  return new Date().getDay() as WeekdayIndex;
}

/** Calendar today, snapped to Mon–Fri for Day mode (weekends → Monday). */
export function schoolWeekday(weekday: number = todayWeekday()): WeekdayIndex {
  if (weekday === 0 || weekday === 6) {
    return 1;
  }
  return weekday as WeekdayIndex;
}

/**
 * Heal legacy AsyncStorage entries that lack `meetingWeekdays` by re-parsing
 * the stored `meetingDays` display string.
 */
export function migrateScheduleClass(
  klass: Partial<ScheduleClass> & Pick<ScheduleClass, "id">,
): ScheduleClass {
  const base = klass as ScheduleClass;
  if (Array.isArray(klass.meetingWeekdays)) {
    return base;
  }

  return {
    ...base,
    meetingWeekdays: parseMeetingWeekdays(klass.meetingDays),
  };
}

export function migrateScheduleClasses(
  classes: Array<Partial<ScheduleClass> & Pick<ScheduleClass, "id">>,
): {
  classes: ScheduleClass[];
  changed: boolean;
} {
  let changed = false;
  const next = classes.map((klass) => {
    const migrated = migrateScheduleClass(klass);
    if (!Array.isArray(klass.meetingWeekdays)) {
      changed = true;
    }
    return migrated;
  });
  return { classes: next, changed };
}
