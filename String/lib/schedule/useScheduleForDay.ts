import { useMemo } from "react";

import { useSchedule } from "@/contexts/ScheduleContext";
import {
  classesForWeekday,
  type WeekdayIndex,
} from "@/lib/schedule/meetingDays";
import type { ScheduleClass } from "@/lib/schedule/types";

/**
 * Day-filtered schedule for Route (and Day mode). Always weekday-based —
 * independent of whether the schedule list is in Day or All mode.
 */
export function useScheduleForDay(weekday?: WeekdayIndex): {
  classes: ScheduleClass[];
  weekday: WeekdayIndex;
  allClasses: ScheduleClass[];
} {
  const { classes: allClasses, selectedWeekday } = useSchedule();
  const activeWeekday = weekday ?? selectedWeekday;

  const classes = useMemo(
    () => classesForWeekday(allClasses, activeWeekday),
    [allClasses, activeWeekday],
  );

  return { classes, weekday: activeWeekday, allClasses };
}
