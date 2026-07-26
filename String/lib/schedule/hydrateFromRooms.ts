import { getCourse, getCourseSections } from "@/lib/api/classes";
import { getMyRooms, type RoomThread } from "@/lib/api/rooms";
import type { CourseSearchHit, EnrollmentPackage } from "@/lib/api/types/enrollment";
import { scheduleClassFromPackage } from "@/lib/schedule/mapSections";
import type { ScheduleClass } from "@/lib/schedule/types";

export type ParsedRoomId = {
  subjectCode: string;
  courseId: string;
  enrollmentClassNumber: number;
};

/** Room ids are `${subjectCode}-${courseId}-${enrollmentClassNumber}`. */
export function parseSectionRoomId(roomId: string): ParsedRoomId | null {
  const parts = roomId.split("-");
  if (parts.length < 3) {
    return null;
  }

  const enrollmentClassNumber = Number(parts[parts.length - 1]);
  const courseId = parts[parts.length - 2]?.trim() ?? "";
  const subjectCode = parts.slice(0, -2).join("-").trim();

  if (
    !subjectCode ||
    !courseId ||
    !Number.isInteger(enrollmentClassNumber) ||
    enrollmentClassNumber < 1
  ) {
    return null;
  }

  return { subjectCode, courseId, enrollmentClassNumber };
}

function stubCourseHit(room: RoomThread, parsed: ParsedRoomId): CourseSearchHit {
  const name = room.name?.trim() || "Untitled course";
  return {
    termCode: "",
    courseId: parsed.courseId,
    subject: {
      termCode: "",
      subjectCode: parsed.subjectCode,
      description: "",
      shortDescription: "",
      formalDescription: "",
    },
    catalogNumber: "",
    title: name,
    courseDesignation: name,
    fullCourseDesignation: name,
  };
}

function stubScheduleClass(room: RoomThread, parsed: ParsedRoomId): ScheduleClass {
  return {
    id: room.id,
    courseId: parsed.courseId,
    subjectCode: parsed.subjectCode,
    name: room.name?.trim() || "Untitled course",
    startTime: "Time TBD",
    location: "Location TBD",
    duration: "Duration TBD",
    professor: "TBD",
    meetingWeekdays: [],
  };
}

function findPackage(
  packages: EnrollmentPackage[],
  enrollmentClassNumber: number,
): EnrollmentPackage | undefined {
  return packages.find((pkg) => pkg.enrollmentClassNumber === enrollmentClassNumber);
}

async function hydrateOne(
  room: RoomThread,
  accessToken: string,
  sectionsCache: Map<string, EnrollmentPackage[]>,
  courseCache: Map<string, CourseSearchHit>,
): Promise<ScheduleClass | null> {
  const parsed =
    room.subjectCode && room.courseId && room.enrollmentClassNumber != null
      ? {
          subjectCode: room.subjectCode,
          courseId: room.courseId,
          enrollmentClassNumber: room.enrollmentClassNumber,
        }
      : parseSectionRoomId(room.id);

  if (!parsed) {
    return null;
  }

  const courseKey = `${parsed.subjectCode}:${parsed.courseId}`;

  try {
    let packages = sectionsCache.get(courseKey);
    if (!packages) {
      const response = await getCourseSections(
        parsed.subjectCode,
        parsed.courseId,
        accessToken,
      );
      packages = response.packages;
      sectionsCache.set(courseKey, packages);
    }

    const pkg = findPackage(packages, parsed.enrollmentClassNumber);
    if (!pkg) {
      return stubScheduleClass(room, parsed);
    }

    let hit = courseCache.get(courseKey);
    if (!hit) {
      try {
        hit = await getCourse(parsed.subjectCode, parsed.courseId, accessToken);
      } catch {
        hit = stubCourseHit(room, parsed);
      }
      courseCache.set(courseKey, hit);
    }

    return scheduleClassFromPackage(hit, pkg);
  } catch {
    return stubScheduleClass(room, parsed);
  }
}

/**
 * Rebuilds missing local schedule rows from server chat-room memberships.
 * Schedule is device-local; rooms are authoritative after reinstall / cleared storage.
 */
export async function hydrateScheduleFromRooms(
  local: ScheduleClass[],
  accessToken: string,
): Promise<{ classes: ScheduleClass[]; added: number }> {
  const rooms = await getMyRooms(accessToken);
  const localIds = new Set(local.map((klass) => klass.id));
  const missing = rooms.filter((room) => !localIds.has(room.id));

  if (missing.length === 0) {
    return { classes: local, added: 0 };
  }

  const sectionsCache = new Map<string, EnrollmentPackage[]>();
  const courseCache = new Map<string, CourseSearchHit>();
  const hydrated: ScheduleClass[] = [];

  for (const room of missing) {
    const entry = await hydrateOne(room, accessToken, sectionsCache, courseCache);
    if (entry && !localIds.has(entry.id)) {
      hydrated.push(entry);
      localIds.add(entry.id);
    }
  }

  if (hydrated.length === 0) {
    return { classes: local, added: 0 };
  }

  return { classes: [...local, ...hydrated], added: hydrated.length };
}
