// Key fields from the UW public enrollment search API.
// Full payloads are stored as JSON in D1; these types cover fields we query or display.

export interface SearchSubject {
  termCode: string;
  subjectCode: string;
  description: string;
  shortDescription: string;
  formalDescription: string;
}

export interface CourseSearchHit {
  termCode: string;
  courseId: string;
  subject: SearchSubject;
  catalogNumber: string;
  title: string;
  courseDesignation: string;
  fullCourseDesignation: string;
  minimumCredits?: number;
  maximumCredits?: number;
  creditRange?: string;
  description?: string;
  [key: string]: unknown;
}

export interface CourseSearchResponse {
  found: number;
  page: number;
  pageSize: number;
  hits: CourseSearchHit[];
}

export interface PackageEnrollmentStatus {
  availableSeats: number;
  waitlistTotal: number;
  status: string;
}

export interface ClassMeeting {
  meetingType: string;
  meetingTimeStart?: number;
  meetingTimeEnd?: number;
  meetingDays?: string | null;
  building?: { buildingName: string; buildingCode?: string } | null;
  room?: string | null;
  [key: string]: unknown;
}

export interface EnrollmentSection {
  sectionNumber: string;
  sessionCode: string;
  type: string;
  instructionMode?: string;
  enrollmentStatus?: {
    capacity: number;
    currentlyEnrolled: number;
    openSeats: number;
    waitlistCapacity?: number;
    waitlistCurrentSize?: number;
    openWaitlistSpots?: number;
  };
  instructors?: unknown[];
  instructor?: unknown;
  classMeetings?: ClassMeeting[];
  [key: string]: unknown;
}

export interface EnrollmentPackage {
  id: string;
  termCode: string;
  subjectCode: string;
  courseId: string;
  catalogNumber: string;
  enrollmentClassNumber: number;
  packageEnrollmentStatus: PackageEnrollmentStatus;
  creditRange?: string;
  classMeetings?: ClassMeeting[];
  sections?: EnrollmentSection[];
  docId: string;
  [key: string]: unknown;
}

export interface CourseSectionsResponse {
  packages: EnrollmentPackage[];
  cached: boolean;
  fetchedAt: string;
  expiresAt: string;
}
