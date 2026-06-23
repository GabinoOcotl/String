import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScheduleErrorBanner } from "@/components/schedule/ScheduleErrorBanner";
import { ScheduleLoadingCenter } from "@/components/schedule/ScheduleLoadingCenter";
import { SectionPickerRow } from "@/components/schedule/SectionPickerRow";
import { themeColors } from "@/constants/theme";
import type { CourseSearchHit } from "@/lib/api/types/enrollment";
import { scheduleClassId } from "@/lib/schedule/mapSections";
import { useCourseSections } from "@/lib/schedule/useCourseSections";

export type AddClassSectionsStepProps = {
  course: CourseSearchHit;
  onBack: () => void;
};

function SectionsEmptyState({
  loading,
  error,
}: {
  loading: boolean;
  error: string | null;
}) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];

  if (loading || error) {
    return null;
  }

  return (
    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
      No sections available for this course.
    </Text>
  );
}

/**
 * Step 2 of add-class: load sections for a course and add one to the schedule.
 * Owns section fetch and add logic via useCourseSections.
 */
export function AddClassSectionsStep({ course, onBack }: AddClassSectionsStepProps) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();

  const { packages, loading, error, addingId, hasClass, selectSection } =
    useCourseSections(course);

  const courseTitle =
    course.courseDesignation?.trim() ||
    course.title?.trim() ||
    "Select a section";

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          hitSlop={8}
        >
          <Text style={[styles.backLabel, { color: colors.link }]}>← Back to search</Text>
        </Pressable>
        <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>
          {courseTitle}
        </Text>
      </View>

      {error ? <ScheduleErrorBanner message={error} /> : null}

      {loading ? (
        <ScheduleLoadingCenter />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id || String(item.enrollmentClassNumber)}
          contentContainerStyle={[styles.list, { paddingBottom: 16 + insets.bottom }]}
          ListEmptyComponent={
            <SectionsEmptyState loading={loading} error={error} />
          }
          renderItem={({ item }) => {
            const id = scheduleClassId(course, item);
            const alreadyAdded = hasClass(id);
            const isAdding = addingId === id;

            return (
              <SectionPickerRow
                pkg={item}
                disabled={alreadyAdded || isAdding}
                onPress={() => void selectSection(item)}
              />
            );
          }}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "600",
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
