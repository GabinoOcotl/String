import type {
  CourseSearchHit,
  CourseSearchResponse,
  CourseSectionsResponse,
} from "@/lib/api/types/enrollment";
import { workerFetch } from "@/lib/api/workerClient";

function coursePath(subjectCode: string, courseId: string): string {
  return `/classes/${encodeURIComponent(subjectCode)}/${encodeURIComponent(courseId)}`;
}

export async function searchCourses(
  query: string,
  page: number,
  pageSize: number,
  accessToken: string,
): Promise<CourseSearchResponse> {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return workerFetch<CourseSearchResponse>(`/classes?${params.toString()}`, {
    accessToken,
  });
}

export async function getCourse(
  subjectCode: string,
  courseId: string,
  accessToken: string,
): Promise<CourseSearchHit> {
  return workerFetch<CourseSearchHit>(coursePath(subjectCode, courseId), {
    accessToken,
  });
}

export async function getCourseSections(
  subjectCode: string,
  courseId: string,
  accessToken: string,
): Promise<CourseSectionsResponse> {
  return workerFetch<CourseSectionsResponse>(
    `${coursePath(subjectCode, courseId)}/sections`,
    { accessToken },
  );
}
