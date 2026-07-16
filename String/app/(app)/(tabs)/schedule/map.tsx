import { FlatList, StyleSheet, Text, useColorScheme, View } from "react-native";

import { ScheduleLoadingCenter } from "@/components/schedule/ScheduleLoadingCenter";
import { themeColors } from "@/constants/theme";
import { useSchedule } from "@/contexts/ScheduleContext";
import { todayWeekday, weekdayName } from "@/lib/schedule/meetingDays";
import type { ScheduleClass } from "@/lib/schedule/types";
import { useScheduleForDay } from "@/lib/schedule/useScheduleForDay";

function stopLabel(klass: ScheduleClass, index: number): string {
  const location = klass.location?.trim() || "Unknown location";
  const time = klass.startTime?.trim() || "TBD";
  return `${index + 1}. ${klass.name} · ${location} · ${time}`;
}

export default function RouteMapScreen() {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const { loading } = useSchedule();
  const { classes, weekday } = useScheduleForDay();

  const realToday = todayWeekday();
  const isSchoolToday = realToday >= 1 && realToday <= 5;
  const dayLabel =
    isSchoolToday && weekday === realToday
      ? "Today's walking order"
      : `${weekdayName(weekday)}'s walking order`;
  const emptyLabel = `No classes on ${weekdayName(weekday)}`;

  if (loading && classes.length === 0) {
    return <ScheduleLoadingCenter />;
  }

  return (
    <FlatList
      data={classes}
      keyExtractor={(item) => item.id}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Route planner</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {dayLabel}
          </Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Stops follow class start time. Map path comes next.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {emptyLabel}
        </Text>
      }
      renderItem={({ item, index }) => (
        <View
          style={[
            styles.stopCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.stopLabel, { color: colors.text }]}>
            {stopLabel(item, index)}
          </Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    gap: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  stopCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  stopLabel: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 8,
  },
  separator: {
    height: 10,
  },
});
