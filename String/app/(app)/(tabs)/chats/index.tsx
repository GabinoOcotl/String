import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, useColorScheme, View } from "react-native";

import { ChatThreadCard } from "@/components/chats/ChatThreadCard";
import { themeColors } from "@/constants/theme";
import { fetchChatThreads, PLACEHOLDER_THREADS, type ChatThread } from "@/lib/chats/threads";

export default function ChatsListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];

  const [threads, setThreads] = useState<ChatThread[]>(() => [...PLACEHOLDER_THREADS]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const next = await fetchChatThreads();
      setThreads(next);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <FlatList
      data={threads}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      renderItem={({ item }) => (
        <ChatThreadCard
          className={item.className}
          lastMessage={item.lastMessage}
          onPress={() => router.push(`/chats/${item.id}`)}
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
  separator: {
    height: 12,
  },
});
