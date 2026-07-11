import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useChatRefresh } from "@/contexts/ChatRefreshContext";
import { joinSectionRoom, leaveSectionRoom } from "@/lib/api/rooms";
import { workerConfigError } from "@/lib/api/workerClient";
import {
  enrollmentClassNumberFromScheduleClass,
  scheduleCourseKey,
} from "@/lib/schedule/mapSections";
import { loadSchedule, saveSchedule } from "@/lib/schedule/storage";
import type { ScheduleClass } from "@/lib/schedule/types";

type ScheduleContextValue = {
  classes: ScheduleClass[];
  loading: boolean;
  error: string | null;
  addClass: (entry: ScheduleClass) => Promise<void>;
  removeClass: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  hasClass: (id: string) => boolean;
  hasCourse: (subjectCode: string, courseId: string) => boolean;
  getClassForCourse: (
    subjectCode: string,
    courseId: string,
  ) => ScheduleClass | undefined;
};

const ScheduleContext = createContext<ScheduleContextValue | undefined>(undefined);

async function healSectionRoomJoins(
  classes: ScheduleClass[],
  accessToken: string,
): Promise<void> {
  await Promise.allSettled(
    classes.map((klass) =>
      joinSectionRoom(
        {
          subjectCode: klass.subjectCode,
          courseId: klass.courseId,
          enrollmentClassNumber: Number(
            enrollmentClassNumberFromScheduleClass(klass),
          ),
          courseDesignation: klass.name,
        },
        accessToken,
      ),
    ),
  );
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const { notifyChatsChanged } = useChatRefresh();
  const accessToken = session?.access_token;
  const [classes, setClasses] = useState<ScheduleClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user?.id) {
      setClasses([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const next = await loadSchedule(user.id);
      setClasses(next);

      if (accessToken && !workerConfigError && next.length > 0) {
        await healSectionRoomJoins(next, accessToken);
      }
    } catch {
      setError("Could not load your schedule.");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, accessToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const persist = useCallback(
    async (next: ScheduleClass[]) => {
      if (!user?.id) {
        throw new Error("Sign in to save your schedule.");
      }

      await saveSchedule(user.id, next);
      setClasses(next);
    },
    [user?.id],
  );

  const getClassForCourse = useCallback(
    (subjectCode: string, courseId: string) => {
      const courseKey = scheduleCourseKey(subjectCode, courseId);
      return classes.find(
        (item) => scheduleCourseKey(item.subjectCode, item.courseId) === courseKey,
      );
    },
    [classes],
  );

  const hasCourse = useCallback(
    (subjectCode: string, courseId: string) =>
      getClassForCourse(subjectCode, courseId) != null,
    [getClassForCourse],
  );

  const addClass = useCallback(
    async (entry: ScheduleClass) => {
      setError(null);

      try {
        const existingForCourse = getClassForCourse(entry.subjectCode, entry.courseId);
        if (existingForCourse && existingForCourse.id !== entry.id) {
          throw new Error("Another section of this course is already on your schedule.");
        }

        const next = [...classes];
        const existingIndex = next.findIndex((item) => item.id === entry.id);

        if (existingIndex >= 0) {
          next[existingIndex] = entry;
        } else {
          next.push(entry);
        }

        await persist(next);
        notifyChatsChanged();
      } catch (err) {
        const message =
          err instanceof Error && err.message.includes("already on your schedule")
            ? err.message
            : "Could not save class to your schedule.";
        setError(message);
        throw new Error(message);
      }
    },
    [classes, getClassForCourse, persist, notifyChatsChanged],
  );

  const removeClass = useCallback(
    async (id: string) => {
      setError(null);

      try {
        if (accessToken && !workerConfigError) {
          await leaveSectionRoom(id, accessToken);
        }

        const next = classes.filter((item) => item.id !== id);
        await persist(next);
        notifyChatsChanged();
      } catch {
        setError("Could not update your schedule.");
        throw new Error("Could not update your schedule.");
      }
    },
    [classes, persist, accessToken, notifyChatsChanged],
  );

  const hasClass = useCallback(
    (id: string) => classes.some((item) => item.id === id),
    [classes],
  );

  const value = useMemo<ScheduleContextValue>(
    () => ({
      classes,
      loading,
      error,
      addClass,
      removeClass,
      reload,
      hasClass,
      hasCourse,
      getClassForCourse,
    }),
    [
      classes,
      loading,
      error,
      addClass,
      removeClass,
      reload,
      hasClass,
      hasCourse,
      getClassForCourse,
    ],
  );

  return (
    <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) {
    throw new Error("useSchedule must be used within ScheduleProvider");
  }
  return ctx;
}
