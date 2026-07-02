import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useSchedule } from "@/contexts/ScheduleContext";
import { getCourseSections } from "@/lib/api/classes";
import { mapWorkerError } from "@/lib/api/mapWorkerError";
import { joinSectionRoom } from "@/lib/api/rooms";
import type { CourseSearchHit, EnrollmentPackage } from "@/lib/api/types/enrollment";
import { workerConfigError } from "@/lib/api/workerClient";
import { scheduleClassFromPackage, scheduleClassId } from "@/lib/schedule/mapSections";

/**
 * Loads sections for a selected course and handles adding one to the schedule.
 * Used by AddClassSectionsStep; fetches when the course prop is set.
 */
export function useCourseSections(course: CourseSearchHit) {
  const router = useRouter();
  const { session } = useAuth();
  const { addClass, hasClass, hasCourse, getClassForCourse } = useSchedule();
  const accessToken = session?.access_token;

  const [packages, setPackages] = useState<EnrollmentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setError("Sign in to view sections.");
      setPackages([]);
      setLoading(false);
      return;
    }

    if (workerConfigError) {
      setError(workerConfigError);
      setPackages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadSections = async () => {
      setLoading(true);
      setError(null);
      setPackages([]);

      try {
        const response = await getCourseSections(
          course.subject.subjectCode,
          course.courseId,
          accessToken,
        );
        if (!cancelled) {
          setPackages(response.packages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(mapWorkerError(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSections();

    return () => {
      cancelled = true;
    };
  }, [course.courseId, course.subject.subjectCode, accessToken]);

  const selectSection = useCallback(
    async (pkg: EnrollmentPackage) => {
      const id = scheduleClassId(course, pkg);

      if (hasClass(id)) {
        return;
      }

      const scheduled = getClassForCourse(
        course.subject.subjectCode,
        course.courseId,
      );
      if (scheduled && scheduled.id !== id) {
        return;
      }

      setAddingId(id);

      if (!accessToken) {
        setError("Sign in to add classes.");
        return;
      }

      try {
        const entry = scheduleClassFromPackage(course, pkg);
        await joinSectionRoom(
          {
            subjectCode: course.subject.subjectCode,
            courseId: course.courseId,
            enrollmentClassNumber: pkg.enrollmentClassNumber,
            courseDesignation: entry.name,
          },
          accessToken,
        );
        await addClass(entry);
        router.back();
      } catch (err) {
        setError(mapWorkerError(err));
      } finally {
        setAddingId(null);
      }
    },
    [course, hasClass, getClassForCourse, addClass, router, accessToken],
  );

  return {
    packages,
    loading,
    error,
    addingId,
    hasClass,
    hasCourse,
    getClassForCourse,
    selectSection,
  };
}
