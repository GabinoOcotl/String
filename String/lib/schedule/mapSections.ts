import type {
  ClassMeeting,
  CourseSearchHit,
  EnrollmentPackage,
  EnrollmentSection,
} from "@/lib/api/types/enrollment";
import { parseMeetingWeekdaysFromMeeting } from "@/lib/schedule/meetingDays";
import type { ScheduleClass } from "@/lib/schedule/types";

const MS_PER_MINUTE = 60_000;

/** UW enrollment API encodes local Central meeting times as UTC epoch ms (1970-01-01). */
const MEETING_TIME_ZONE = "America/Chicago";

export function formatMeetingTime(meetingTimeMs: number): string {
  return new Date(meetingTimeMs).toLocaleTimeString("en-US", {
    timeZone: MEETING_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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
  const nameField = record.name;

  if (nameField && typeof nameField === "object") {
    const name = nameField as Record<string, unknown>;
    const parts = [
      name.legalFirst ?? name.first,
      name.legalMiddle ?? name.middle,
      name.last,
    ].filter(
      (part): part is string => typeof part === "string" && part.trim().length > 0,
    );

    if (parts.length > 0) {
      return parts.join(" ").trim();
    }
  }

  if (typeof nameField === "string" && nameField.trim()) {
    return nameField.trim();
  }

  const directName =
    record.displayName ?? record.instructorName ?? record.fullName;

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

function collectSectionInstructors(section: EnrollmentSection): unknown[] {
  const instructors: unknown[] = [];

  if (Array.isArray(section.instructors)) {
    instructors.push(...section.instructors);
  }

  const singular = section.instructor;
  if (singular && typeof singular === "object") {
    instructors.push(singular);
  }

  return instructors;
}

function formatProfessor(pkg: EnrollmentPackage): string {
  const instructors: unknown[] = [];

  for (const section of pkg.sections ?? []) {
    instructors.push(...collectSectionInstructors(section));
  }

  if (Array.isArray(pkg.instructors)) {
    instructors.push(...(pkg.instructors as unknown[]));
  }

  const packageInstructor = pkg.instructor;
  if (packageInstructor && typeof packageInstructor === "object") {
    instructors.push(packageInstructor);
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

export function scheduleCourseKey(subjectCode: string, courseId: string): string {
  return `${subjectCode}-${courseId}`;
}

export function scheduleClassId(
  hit: CourseSearchHit,
  pkg: EnrollmentPackage,
): string {
  return `${scheduleCourseKey(hit.subject.subjectCode, hit.courseId)}-${pkg.enrollmentClassNumber}`;
}

export function enrollmentClassNumberFromScheduleClass(klass: ScheduleClass): string {
  const prefix = `${scheduleCourseKey(klass.subjectCode, klass.courseId)}-`;
  return klass.id.startsWith(prefix) ? klass.id.slice(prefix.length) : klass.id;
}

function sectionNumbersFromPackage(pkg: EnrollmentPackage): {
  lectureSectionNumber?: string;
  discussionSectionNumber?: string;
} {
  const lec = pkg.sections?.find((s) => s.type === "LEC");
  const dis = pkg.sections?.find((s) => s.type === "DIS");

  return {
    lectureSectionNumber: lec?.sectionNumber,
    discussionSectionNumber: dis?.sectionNumber,
  };
}

export function formatSectionNumberDisplay(sectionNumber: string): string {
  const trimmed = sectionNumber.replace(/^0+/, "");
  return trimmed || "0";
}

export function formatSectionHeaderParts(
  enrollmentClassNumber: number | string,
  lectureSectionNumber?: string,
  discussionSectionNumber?: string,
): string {
  const parts: string[] = [];

  if (lectureSectionNumber) {
    parts.push(`Lec ${formatSectionNumberDisplay(lectureSectionNumber)}`);
  }
  if (discussionSectionNumber) {
    parts.push(`Dis ${discussionSectionNumber}`);
  }
  parts.push(`Section ${enrollmentClassNumber}`);

  return parts.join(" | ");
}

export function formatSectionHeader(pkg: EnrollmentPackage): string {
  const { lectureSectionNumber, discussionSectionNumber } =
    sectionNumbersFromPackage(pkg);

  return formatSectionHeaderParts(
    pkg.enrollmentClassNumber,
    lectureSectionNumber,
    discussionSectionNumber,
  );
}

export function formatScheduleClassHeader(klass: ScheduleClass): string {
  return formatSectionHeaderParts(
    enrollmentClassNumberFromScheduleClass(klass),
    klass.lectureSectionNumber,
    klass.discussionSectionNumber,
  );
}

export function formatChatThreadTitle(
  courseName: string,
  lectureSectionNumber?: string,
  discussionSectionNumber?: string,
): string {
  const parts = [courseName.trim() || "Chat"];

  if (lectureSectionNumber) {
    parts.push(`Lec ${formatSectionNumberDisplay(lectureSectionNumber)}`);
  }
  if (discussionSectionNumber) {
    parts.push(`Dis ${formatSectionNumberDisplay(discussionSectionNumber)}`);
  }

  return parts.join(" - ");
}

export function scheduleClassFromPackage(
  hit: CourseSearchHit,
  pkg: EnrollmentPackage,
): ScheduleClass {
  const meeting = pickPrimaryMeeting(pkg);
  const subjectCode = hit.subject.subjectCode;
  const { lectureSectionNumber, discussionSectionNumber } =
    sectionNumbersFromPackage(pkg);

  return {
    id: scheduleClassId(hit, pkg),
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
    meetingWeekdays: parseMeetingWeekdaysFromMeeting(meeting),
    meetingTimeStartMs: meeting?.meetingTimeStart ?? undefined,
    lectureSectionNumber,
    discussionSectionNumber,
  };
}
