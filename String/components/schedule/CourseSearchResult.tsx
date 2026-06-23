import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";

import { themeColors } from "@/constants/theme";
import type { CourseSearchHit } from "@/lib/api/types/enrollment";

export type CourseSearchResultProps = {
  hit: CourseSearchHit;
  onPress: () => void;
};

function formatCredits(hit: CourseSearchHit): string | null {
  if (hit.creditRange?.trim()) {
    return hit.creditRange.trim();
  }

  const min = hit.minimumCredits;
  const max = hit.maximumCredits;

  if (min != null && max != null) {
    return min === max ? `${min} credits` : `${min}–${max} credits`;
  }

  if (min != null) {
    return `${min} credits`;
  }

  if (max != null) {
    return `${max} credits`;
  }

  return null;
}

export function CourseSearchResult({ hit, onPress }: CourseSearchResultProps) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const credits = formatCredits(hit);
  const designation =
    hit.courseDesignation?.trim() || hit.fullCourseDesignation?.trim() || "Course";
  const title = hit.title?.trim() || "Untitled course";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.designation, { color: colors.text }]}>{designation}</Text>
      <Text style={[styles.title, { color: colors.textMuted }]} numberOfLines={2}>
        {title}
      </Text>
      {credits ? (
        <Text style={[styles.credits, { color: colors.textMuted }]}>{credits}</Text>
      ) : null}
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
  designation: {
    fontSize: 17,
    fontWeight: "600",
  },
  title: {
    fontSize: 14,
  },
  credits: {
    fontSize: 13,
    marginTop: 2,
  },
});
