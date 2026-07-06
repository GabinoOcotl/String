import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { mapWorkerError } from "@/lib/api/mapWorkerError";
import { workerConfigError } from "@/lib/api/workerClient";
import { fetchChatThreads, type ChatThread } from "@/lib/chats/threads";

export default function ChatsListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(
    async (isRefresh = false) => {
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

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const next = await fetchChatThreads(accessToken);
        setThreads(next);
      } catch (err) {
        setError(mapWorkerError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const onRefresh = useCallback(() => {
    void loadThreads(true);
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
      renderItem={({ item }) => (
        <ChatThreadCard
          className={item.className}
          lastMessage={item.lastMessage}
          onPress={() =>
            router.push({
              pathname: "/chats/[threadId]",
              params: { threadId: item.id, name: item.className },
            })
          }
        />
      )}
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
