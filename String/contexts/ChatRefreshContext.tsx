import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ChatRefreshContextValue = {
  refreshKey: number;
  notifyChatsChanged: () => void;
};

const ChatRefreshContext = createContext<ChatRefreshContextValue | undefined>(
  undefined,
);

export function ChatRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const notifyChatsChanged = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const value = useMemo(
    () => ({ refreshKey, notifyChatsChanged }),
    [refreshKey, notifyChatsChanged],
  );

  return (
    <ChatRefreshContext.Provider value={value}>
      {children}
    </ChatRefreshContext.Provider>
  );
}

export function useChatRefresh() {
  const ctx = useContext(ChatRefreshContext);
  if (!ctx) {
    throw new Error("useChatRefresh must be used within ChatRefreshProvider");
  }
  return ctx;
}
