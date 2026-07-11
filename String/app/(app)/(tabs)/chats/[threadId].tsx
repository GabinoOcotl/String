import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useChatRefresh } from "@/contexts/ChatRefreshContext";
import { mapWorkerError } from "@/lib/api/mapWorkerError";
import {
  getMessages,
  sendMessage as sendMessageApi,
  type ChatMessage as ApiChatMessage,
} from "@/lib/api/messages";
import { workerConfigError } from "@/lib/api/workerClient";
import { getThreadTitle } from "@/lib/chats/threads";
import { useRoomSocket } from "@/lib/chats/useRoomSocket";

type ThreadMessage = {
  id: string;
  body: string;
  sender: string;
  isOwn: boolean;
};

function mapApiMessage(message: ApiChatMessage): ThreadMessage {
  return {
    id: message.id,
    body: message.text,
    sender: message.is_own ? "You" : message.sender_name,
    isOwn: message.is_own,
  };
}

export default function ChatThreadScreen() {
  const { threadId, name } = useLocalSearchParams<{ threadId: string; name?: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const { session } = useAuth();
  const { notifyChatsChanged } = useChatRefresh();
  const accessToken = session?.access_token;
  const userId = session?.user?.id;

  const id = typeof threadId === "string" ? threadId : "";
  const roomName = typeof name === "string" ? name : undefined;
  const title = getThreadTitle(id, roomName);

  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(
    async (isRefresh = false) => {
      if (!id) {
        setMessages([]);
        setError("Invalid chat.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!accessToken) {
        setMessages([]);
        setError("Sign in to view messages.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (workerConfigError) {
        setMessages([]);
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
        const rows = await getMessages(id, accessToken);
        setMessages(rows.map(mapApiMessage));
      } catch (err) {
        setError(mapWorkerError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, accessToken],
  );

  const appendMessage = useCallback((message: ApiChatMessage) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) {
        return prev;
      }
      return [...prev, mapApiMessage(message)];
    });
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useRoomSocket({
    roomId: id,
    accessToken,
    userId,
    enabled: Boolean(id && accessToken && !loading),
    onMessage: appendMessage,
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title });
    const tab = navigation.getParent();
    tab?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      tab?.setOptions({
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      });
    };
  }, [navigation, title, colors.surface, colors.border]);

  const sendMessage = useCallback(async () => {
    const body = draft.trim();
    if (!body || !id || !accessToken || sending) return;

    setSending(true);
    setError(null);

    try {
      const created = await sendMessageApi(id, body, accessToken);
      appendMessage(created);
      setDraft("");
      notifyChatsChanged();
    } catch (err) {
      setError(mapWorkerError(err));
    } finally {
      setSending(false);
    }
  }, [draft, id, accessToken, sending, appendMessage, notifyChatsChanged]);

  const onRefresh = useCallback(() => {
    void loadMessages(true);
  }, [loadMessages]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.errorText, { color: colors.textMuted }]}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No messages yet. Say hello!
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.isOwn ? styles.bubbleOwn : styles.bubbleOther,
              {
                backgroundColor: item.isOwn ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {!item.isOwn ? (
              <Text style={[styles.sender, { color: colors.textMuted }]}>{item.sender}</Text>
            ) : null}
            <Text style={[styles.body, { color: item.isOwn ? colors.onPrimary : colors.text }]}>
              {item.body}
            </Text>
          </View>
        )}
      />

      <View
        style={[
          styles.composer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.fieldBg,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Message"
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={2000}
          editable={!sending}
          onSubmitEditing={() => void sendMessage()}
          blurOnSubmit={false}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            { backgroundColor: colors.primary },
            pressed && styles.sendPressed,
            (!draft.trim() || sending) && styles.sendDisabled,
          ]}
          onPress={() => void sendMessage()}
          disabled={!draft.trim() || sending}
        >
          <Text style={[styles.sendLabel, { color: colors.onPrimary }]}>
            {sending ? "…" : "Send"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  messageList: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 24,
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
  },
  bubbleOwn: {
    alignSelf: "flex-end",
    borderWidth: 0,
  },
  bubbleOther: {
    alignSelf: "flex-start",
  },
  sender: {
    fontSize: 12,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 2,
  },
  sendPressed: {
    opacity: 0.85,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});
