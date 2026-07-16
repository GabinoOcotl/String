import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { ScheduleErrorBanner } from "@/components/schedule/ScheduleErrorBanner";
import { ScheduleLoadingCenter } from "@/components/schedule/ScheduleLoadingCenter";
import { SwipeableScheduleCard } from "@/components/schedule/SwipeableScheduleCard";
import { themeColors } from "@/constants/theme";
import { useSchedule } from "@/contexts/ScheduleContext";
import {
  compareByNameThenTime,
  todayWeekday,
  weekdayName,
  weekdayShortName,
  WEEKDAY_STRIP_ORDER,
  type WeekdayIndex,
} from "@/lib/schedule/meetingDays";
import type { ScheduleClass } from "@/lib/schedule/types";
import { useScheduleForDay } from "@/lib/schedule/useScheduleForDay";
import {
  loadScheduleViewMode,
  saveScheduleViewMode,
  type ScheduleViewMode,
} from "@/lib/schedule/viewModeStorage";

export default function TodayScheduleScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const {
    classes,
    loading,
    error,
    reload,
    removeClass,
    selectedWeekday,
    setSelectedWeekday,
  } = useSchedule();
  const { classes: dayClasses } = useScheduleForDay();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("day");
  const [viewModeReady, setViewModeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadScheduleViewMode().then((mode) => {
      if (!cancelled) {
        setViewMode(mode);
        setViewModeReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setViewModeAndPersist = useCallback((mode: ScheduleViewMode) => {
    setViewMode(mode);
    void saveScheduleViewMode(mode);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  const handleRemove = useCallback(
    (id: string) => {
      void removeClass(id);
    },
    [removeClass],
  );

  const displayedClasses = useMemo(() => {
    if (viewMode === "day") {
      return dayClasses;
    }
    return [...classes].sort(compareByNameThenTime);
  }, [classes, dayClasses, viewMode]);

  const realToday = todayWeekday();
  const isWeekdayToday = realToday >= 1 && realToday <= 5;
  const dayLabel =
    isWeekdayToday && selectedWeekday === realToday
      ? "Today's classes"
      : `${weekdayName(selectedWeekday)}'s classes`;
  const headerLabel = viewMode === "day" ? dayLabel : "All classes";
  const emptyLabel =
    viewMode === "day"
      ? `No classes on ${weekdayName(selectedWeekday)}`
      : "No classes yet — tap + to add";

  const renderItem = useCallback(
    ({ item }: { item: ScheduleClass }) => (
      <SwipeableScheduleCard
        name={item.name}
        startTime={item.startTime}
        duration={item.duration}
        location={item.location}
        professor={item.professor}
        meetingDays={viewMode === "all" ? item.meetingDays : undefined}
        onPress={() => router.push(`/schedule/(today)/${item.id}`)}
        onRemove={() => handleRemove(item.id)}
      />
    ),
    [handleRemove, router, viewMode],
  );

  const listHeader = (
    <>
      <View
        style={[
          styles.segmented,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === "day" }}
          onPress={() => setViewModeAndPersist("day")}
          style={[
            styles.segment,
            viewMode === "day" && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.segmentLabel,
              { color: viewMode === "day" ? colors.onPrimary : colors.textMuted },
            ]}
          >
            Day
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === "all" }}
          onPress={() => setViewModeAndPersist("all")}
          style={[
            styles.segment,
            viewMode === "all" && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.segmentLabel,
              { color: viewMode === "all" ? colors.onPrimary : colors.textMuted },
            ]}
          >
            All
          </Text>
        </Pressable>
      </View>

      {viewMode === "day" ? (
        <View style={styles.weekdayStrip}>
          {WEEKDAY_STRIP_ORDER.map((day) => {
            const selected = day === selectedWeekday;
            const isToday = isWeekdayToday && day === realToday;
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSelectedWeekday(day as WeekdayIndex)}
                style={[
                  styles.weekdayChip,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.weekdayChipLabel,
                    {
                      color: selected ? colors.onPrimary : colors.textMuted,
                      fontWeight: isToday || selected ? "700" : "500",
                    },
                  ]}
                >
                  {weekdayShortName(day)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Text style={[styles.date, { color: colors.textMuted }]}>{headerLabel}</Text>
      {error ? <ScheduleErrorBanner message={error} /> : null}
    </>
  );

  if ((loading || !viewModeReady) && classes.length === 0 && !refreshing) {
    return <ScheduleLoadingCenter />;
  }

  return (
    <FlatList
      data={displayedClasses}
      keyExtractor={(item) => item.id}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {emptyLabel}
        </Text>
      }
      renderItem={renderItem}
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
  segmented: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  weekdayStrip: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  weekdayChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  weekdayChipLabel: {
    fontSize: 12,
  },
  date: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 8,
  },
  separator: {
    height: 12,
  },
});
