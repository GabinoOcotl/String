import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { ChatThreadCard } from "@/components/chats/ChatThreadCard";
import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useChatRefresh } from "@/contexts/ChatRefreshContext";
import { useSchedule } from "@/contexts/ScheduleContext";
import { mapWorkerError } from "@/lib/api/mapWorkerError";
import { workerConfigError } from "@/lib/api/workerClient";
import { fetchChatThreads, resolveThreadTitle, type ChatThread } from "@/lib/chats/threads";

type LoadMode = "initial" | "pull" | "silent";

export default function ChatsListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const { session } = useAuth();
  const { refreshKey } = useChatRefresh();
  const { classes } = useSchedule();
  const accessToken = session?.access_token;
  const hasLoadedRef = useRef(false);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(
    async (mode: LoadMode = "initial") => {
      if (!accessToken) {
        setThreads([]);
        setError("Sign in to view chats.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (workerConfigError) {
        setThreads([]);
        setError(workerConfigError);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (mode === "pull") {
        setRefreshing(true);
      } else if (mode === "initial") {
        setLoading(true);
      }
      // silent: keep showing current list; no spinner / RefreshControl inset

      try {
        const next = await fetchChatThreads(accessToken);
        setThreads(next);
        setError(null);
        hasLoadedRef.current = true;
      } catch (err) {
        // Keep an existing list visible on background failures; only surface
        // errors for user-visible loads (initial / pull-to-refresh).
        if (mode !== "silent" || !hasLoadedRef.current) {
          setError(mapWorkerError(err));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken],
  );

  // Initial load + access-token changes only (not every refreshKey bump).
  useEffect(() => {
    void loadThreads("initial");
  }, [loadThreads]);

  // Eager refetch when schedule/send invalidates — silent so the list stays mounted.
  useEffect(() => {
    if (refreshKey === 0) return;
    void loadThreads("silent");
  }, [refreshKey, loadThreads]);

  // Covers inactive-tab / stack cases where refreshKey effects can be missed until
  // the list regains focus (back from thread, or switch from Schedule).
  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedRef.current) return;
      void loadThreads("silent");
    }, [loadThreads]),
  );

  const onRefresh = useCallback(() => {
    void loadThreads("pull");
  }, [loadThreads]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textMuted }]}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={threads}
      keyExtractor={(item) => item.id}
      contentContainerStyle={threads.length === 0 ? styles.emptyList : styles.list}
      style={{ backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      ListEmptyComponent={
        <Text style={[styles.message, { color: colors.textMuted }]}>
          Add a class to your schedule to join its group chat.
        </Text>
      }
      renderItem={({ item }) => {
        const threadTitle = resolveThreadTitle(item.id, item.className, classes);

        return (
          <ChatThreadCard
            className={threadTitle}
            lastMessage={item.lastMessage}
            onPress={() =>
              router.push({
                pathname: "/chats/[threadId]",
                params: {
                  threadId: item.id,
                  name: threadTitle,
                },
              })
            }
          />
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  separator: {
    height: 12,
  },
});
