import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme } from "react-native";

import { themeColors } from "@/constants/theme";

const PLACEHOLDER_CLASSES = [
  {
    id: "calc-101",
    name: "Calculus I",
    startTime: "9:00 AM",
    location: "Science Hall 204",
    duration: "50 min",
    professor: "Dr. Chen",
  },
  {
    id: "cs-220",
    name: "Data Structures",
    startTime: "11:30 AM",
    location: "Engineering 110",
    duration: "75 min",
    professor: "Prof. Rivera",
  },
] as const;

export default function TodayScheduleScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.date, { color: colors.textMuted }]}>Today&apos;s classes</Text>

      {PLACEHOLDER_CLASSES.map((item) => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.cardPressed,
          ]}
          onPress={() => router.push(`/schedule/(today)/${item.id}`)}
        >
          <Text style={[styles.className, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {item.startTime} · {item.duration}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{item.location}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{item.professor}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  date: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
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
