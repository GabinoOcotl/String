export type ScheduleClass = {
  id: string;
  courseId: string;
  subjectCode: string;
  name: string;
  startTime: string;
  location: string;
  duration: string;
  professor: string;
  /** UW compact display codes, e.g. `"TR"`. */
  meetingDays?: string;
  /** JS `getDay()` indices (0=Sun … 6=Sat). Empty = unknown / unscheduled. */
  meetingWeekdays: number[];
  /** Raw meeting start ms (UW epoch encoding) for sorting within a day. */
  meetingTimeStartMs?: number;
  /** Building coords from primary CLASS meeting; null when unknown. */
  latitude?: number | null;
  longitude?: number | null;
  buildingName?: string;
  lectureSectionNumber?: string;
  discussionSectionNumber?: string;
};
