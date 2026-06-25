import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
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
import type { ScheduleClass } from "@/lib/schedule/types";

export default function TodayScheduleScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const { classes, loading, error, reload, removeClass } = useSchedule();
  const [refreshing, setRefreshing] = useState(false);

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

  const renderItem = useCallback(
    ({ item }: { item: ScheduleClass }) => (
      <SwipeableScheduleCard
        name={item.name}
        startTime={item.startTime}
        duration={item.duration}
        location={item.location}
        professor={item.professor}
        onPress={() => router.push(`/schedule/(today)/${item.id}`)}
        onRemove={() => handleRemove(item.id)}
      />
    ),
    [handleRemove, router],
  );

  const listHeader = (
    <>
      <Text style={[styles.date, { color: colors.textMuted }]}>Today&apos;s classes</Text>
      {error ? <ScheduleErrorBanner message={error} /> : null}
    </>
  );

  if (loading && classes.length === 0 && !refreshing) {
    return <ScheduleLoadingCenter />;
  }

  return (
    <FlatList
      data={classes}
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
          No classes yet — tap + to add
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
