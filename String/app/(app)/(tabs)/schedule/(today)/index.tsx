import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, useColorScheme } from "react-native";

import { ClassScheduleCard } from "@/components/schedule/ClassScheduleCard";
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
        <ClassScheduleCard
          key={item.id}
          name={item.name}
          startTime={item.startTime}
          duration={item.duration}
          location={item.location}
          professor={item.professor}
          onPress={() => router.push(`/schedule/(today)/${item.id}`)}
        />
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
});
