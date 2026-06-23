import type {
  ClassMeeting,
  CourseSearchHit,
  EnrollmentPackage,
} from "@/lib/api/types/enrollment";
import type { ScheduleClass } from "@/lib/schedule/types";

const MS_PER_MINUTE = 60_000;

export function formatMeetingTime(msSinceMidnight: number): string {
  const totalMinutes = Math.floor(msSinceMidnight / MS_PER_MINUTE);
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function formatDuration(startMs: number, endMs: number): string {
  const minutes = Math.round((endMs - startMs) / MS_PER_MINUTE);
  if (minutes <= 0) {
    return "Duration TBD";
  }
  return `${minutes} min`;
}

export function formatLocation(meeting: ClassMeeting): string {
  const building = meeting.building?.buildingName?.trim();
  const room = meeting.room?.trim();

  if (building && room) {
    return `${building} ${room}`;
  }
  if (building) {
    return building;
  }
  if (room) {
    return room;
  }
  return "Location TBD";
}

function isClassMeeting(meeting: ClassMeeting): boolean {
  return meeting.meetingType === "CLASS";
}

function pickPrimaryMeeting(pkg: EnrollmentPackage): ClassMeeting | undefined {
  const packageMeeting = pkg.classMeetings?.find(isClassMeeting);
  if (packageMeeting) {
    return packageMeeting;
  }

  for (const section of pkg.sections ?? []) {
    const sectionMeeting = section.classMeetings?.find(isClassMeeting);
    if (sectionMeeting) {
      return sectionMeeting;
    }
  }

  return pkg.classMeetings?.[0] ?? pkg.sections?.[0]?.classMeetings?.[0];
}

function parseInstructorName(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const directName =
    record.name ?? record.displayName ?? record.instructorName ?? record.fullName;

  if (typeof directName === "string" && directName.trim()) {
    return directName.trim();
  }

  const first = record.firstName ?? record.givenName;
  const last = record.lastName ?? record.familyName ?? record.surname;
  const parts = [first, last].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0,
  );

  if (parts.length > 0) {
    return parts.join(" ").trim();
  }

  return null;
}

function formatProfessor(pkg: EnrollmentPackage): string {
  const instructors: unknown[] = [];

  for (const section of pkg.sections ?? []) {
    if (Array.isArray(section.instructors)) {
      instructors.push(...section.instructors);
    }
  }

  const names = instructors
    .map(parseInstructorName)
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) {
    return "TBD";
  }

  return [...new Set(names)].join(", ");
}

function scheduleClassName(hit: CourseSearchHit): string {
  return hit.courseDesignation?.trim() || hit.title?.trim() || "Untitled course";
}

export function scheduleClassFromPackage(
  hit: CourseSearchHit,
  pkg: EnrollmentPackage,
): ScheduleClass {
  const meeting = pickPrimaryMeeting(pkg);
  const subjectCode = hit.subject.subjectCode;

  return {
    id: `${subjectCode}-${hit.courseId}-${pkg.enrollmentClassNumber}`,
    courseId: hit.courseId,
    subjectCode,
    name: scheduleClassName(hit),
    startTime:
      meeting?.meetingTimeStart != null
        ? formatMeetingTime(meeting.meetingTimeStart)
        : "Time TBD",
    location: meeting ? formatLocation(meeting) : "Location TBD",
    duration:
      meeting?.meetingTimeStart != null && meeting.meetingTimeEnd != null
        ? formatDuration(meeting.meetingTimeStart, meeting.meetingTimeEnd)
        : "Duration TBD",
    professor: formatProfessor(pkg),
    meetingDays: meeting?.meetingDays ?? undefined,
  };
}
