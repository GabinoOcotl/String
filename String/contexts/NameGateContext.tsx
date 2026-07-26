import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type NameGateStatus = "loading" | "ready" | "needs_name" | "error";

type NameGateContextValue = {
  nameStatus: NameGateStatus;
  nameError: string | null;
  setNameStatus: (status: NameGateStatus) => void;
  setNameError: (error: string | null) => void;
  markNameComplete: () => void;
  refreshNameGate: () => void;
  nameCheckAttempt: number;
};

const NameGateContext = createContext<NameGateContextValue | undefined>(
  undefined,
);

export function NameGateProvider({ children }: { children: ReactNode }) {
  const [nameStatus, setNameStatus] = useState<NameGateStatus>("loading");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameCheckAttempt, setNameCheckAttempt] = useState(0);

  const markNameComplete = useCallback(() => {
    setNameStatus("ready");
    setNameError(null);
  }, []);

  const refreshNameGate = useCallback(() => {
    setNameCheckAttempt((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({
      nameStatus,
      nameError,
      setNameStatus,
      setNameError,
      markNameComplete,
      refreshNameGate,
      nameCheckAttempt,
    }),
    [
      nameStatus,
      nameError,
      markNameComplete,
      refreshNameGate,
      nameCheckAttempt,
    ],
  );

  return (
    <NameGateContext.Provider value={value}>{children}</NameGateContext.Provider>
  );
}

export function useNameGate() {
  const ctx = useContext(NameGateContext);
  if (!ctx) {
    throw new Error("useNameGate must be used within NameGateProvider");
  }
  return ctx;
}
