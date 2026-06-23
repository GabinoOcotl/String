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
};

const ScheduleContext = createContext<ScheduleContextValue | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
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
    } catch {
      setError("Could not load your schedule.");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

  const addClass = useCallback(
    async (entry: ScheduleClass) => {
      setError(null);

      try {
        const next = [...classes];
        const existingIndex = next.findIndex((item) => item.id === entry.id);

        if (existingIndex >= 0) {
          next[existingIndex] = entry;
        } else {
          next.push(entry);
        }

        await persist(next);
      } catch {
        setError("Could not save class to your schedule.");
        throw new Error("Could not save class to your schedule.");
      }
    },
    [classes, persist],
  );

  const removeClass = useCallback(
    async (id: string) => {
      setError(null);

      try {
        const next = classes.filter((item) => item.id !== id);
        await persist(next);
      } catch {
        setError("Could not update your schedule.");
        throw new Error("Could not update your schedule.");
      }
    },
    [classes, persist],
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
    }),
    [classes, loading, error, addClass, removeClass, reload, hasClass],
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
