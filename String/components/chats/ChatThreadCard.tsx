import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";

import { themeColors } from "@/constants/theme";

export type ChatThreadCardProps = {
  className: string;
  lastMessage: string;
  onPress: () => void;
};

export function ChatThreadCard({ className, lastMessage, onPress }: ChatThreadCardProps) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.className, { color: colors.text }]}>{className}</Text>
      <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={1}>
        {lastMessage}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  cardPressed: {
    opacity: 0.85,
  },
  className: {
    fontSize: 17,
    fontWeight: "600",
  },
  preview: {
    fontSize: 14,
  },
});
