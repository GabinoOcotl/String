import { useLocalSearchParams } from "expo-router";
import { useLayoutEffect } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { themeColors } from "@/constants/theme";
import { useSchedule } from "@/contexts/ScheduleContext";

function DetailRow({ label, value }: { label: string; value: string }) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function ClassDetailScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const { classes } = useSchedule();

  const id = typeof classId === "string" ? classId : "";
  const scheduleClass = classes.find((item) => item.id === id);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: scheduleClass?.name ?? "Class",
    });
  }, [navigation, scheduleClass?.name]);

  if (!scheduleClass) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.textMuted }]}>
          Class not found in your schedule.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.courseCode, { color: colors.textMuted }]}>
        {scheduleClass.subjectCode} {scheduleClass.courseId}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <DetailRow label="Time" value={`${scheduleClass.startTime} · ${scheduleClass.duration}`} />
        {scheduleClass.meetingDays ? (
          <DetailRow label="Days" value={scheduleClass.meetingDays} />
        ) : null}
        <DetailRow label="Location" value={scheduleClass.location} />
        <DetailRow label="Instructor" value={scheduleClass.professor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  row: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
  },
  notFound: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 48,
  },
});
