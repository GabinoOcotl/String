import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";

import { themeColors } from "@/constants/theme";

export type ClassScheduleCardProps = {
  name: string;
  startTime: string;
  duration: string;
  location: string;
  professor: string;
  /** Optional meeting-days label (e.g. All mode). */
  meetingDays?: string;
  onPress: () => void;
};

export function ClassScheduleCard({
  name,
  startTime,
  duration,
  location,
  professor,
  meetingDays,
  onPress,
}: ClassScheduleCardProps) {
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
      <Text style={[styles.className, { color: colors.text }]}>{name}</Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        {meetingDays ? `${meetingDays} · ` : ""}
        {startTime} · {duration}
      </Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>{location}</Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>{professor}</Text>
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
  meta: {
    fontSize: 14,
  },
});
