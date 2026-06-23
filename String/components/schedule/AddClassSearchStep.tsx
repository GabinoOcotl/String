import { FlatList, StyleSheet, Text, useColorScheme, View } from "react-native";

import { CourseSearchBar } from "@/components/schedule/CourseSearchBar";
import { CourseSearchResult } from "@/components/schedule/CourseSearchResult";
import { ScheduleErrorBanner } from "@/components/schedule/ScheduleErrorBanner";
import { ScheduleLoadingCenter } from "@/components/schedule/ScheduleLoadingCenter";
import { themeColors } from "@/constants/theme";
import type { CourseSearchHit } from "@/lib/api/types/enrollment";
import {
  type CourseSearchSnapshot,
  useCourseSearch,
} from "@/lib/schedule/useCourseSearch";

export type AddClassSearchStepProps = {
  onSelectCourse: (hit: CourseSearchHit, snapshot: CourseSearchSnapshot) => void;
  initialQuery?: string;
  initialResults?: CourseSearchHit[];
};

function SearchEmptyState({
  query,
  loading,
  error,
}: {
  query: string;
  loading: boolean;
  error: string | null;
}) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];

  if (loading || error) {
    return null;
  }

  const message = query
    ? "No courses found."
    : "Search the UW course catalog by name or number.";

  return (
    <Text style={[styles.emptyText, { color: colors.textMuted }]}>{message}</Text>
  );
}

/**
 * Step 1 of add-class: search the catalog and pick a course.
 * Owns search state via useCourseSearch; passes a snapshot up on selection
 * so the orchestrator can restore this step when the user goes back.
 */
export function AddClassSearchStep({
  onSelectCourse,
  initialQuery,
  initialResults,
}: AddClassSearchStepProps) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];

  const { query, results, loading, error, onQueryChange, getSnapshot } =
    useCourseSearch({ initialQuery, initialResults });

  const handleSelectCourse = (hit: CourseSearchHit) => {
    onSelectCourse(hit, getSnapshot());
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <CourseSearchBar
        onQueryChange={onQueryChange}
        initialValue={initialQuery}
        autoFocus
      />

      {error ? <ScheduleErrorBanner message={error} /> : null}

      {loading ? (
        <ScheduleLoadingCenter />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.subject.subjectCode}-${item.courseId}`}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <SearchEmptyState query={query} loading={loading} error={error} />
          }
          renderItem={({ item }) => (
            <CourseSearchResult
              hit={item}
              onPress={() => handleSelectCourse(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    paddingTop: 32,
    paddingHorizontal: 16,
  },
});
