import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useLayoutEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme";

import { getThreadTitle } from "@/lib/chats/threads";

type ChatMessage = {
  id: string;
  body: string;
  sender: string;
  isOwn: boolean;
};

const PLACEHOLDER_MESSAGES: Record<string, ChatMessage[]> = {
  "calc-101": [
    { id: "1", body: "Anyone going to the review session?", sender: "Alex", isOwn: false },
    { id: "2", body: "See you at review session", sender: "You", isOwn: true },
  ],
  "cs-220": [
    { id: "1", body: "Project groups are on the course site.", sender: "Sam", isOwn: false },
    { id: "2", body: "Project groups posted", sender: "You", isOwn: true },
  ],
};

export default function ChatThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];

  const id = typeof threadId === "string" ? threadId : "";
  const title = getThreadTitle(id);

  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => PLACEHOLDER_MESSAGES[id] ?? [],
  );

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

  const sendMessage = useCallback(() => {
    const body = draft.trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), body, sender: "You", isOwn: true },
    ]);
    setDraft("");
  }, [draft]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
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
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            { backgroundColor: colors.primary },
            pressed && styles.sendPressed,
            !draft.trim() && styles.sendDisabled,
          ]}
          onPress={sendMessage}
          disabled={!draft.trim()}
        >
          <Text style={[styles.sendLabel, { color: colors.onPrimary }]}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
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
