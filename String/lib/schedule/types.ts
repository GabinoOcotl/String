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
  lectureSectionNumber?: string;
  discussionSectionNumber?: string;
};
