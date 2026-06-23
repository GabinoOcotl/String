import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";

import { themeColors } from "@/constants/theme";
import type { ClassMeeting, EnrollmentPackage } from "@/lib/api/types/enrollment";
import {
  formatLocation,
  formatMeetingTime,
} from "@/lib/schedule/mapSections";

export type SectionPickerRowProps = {
  pkg: EnrollmentPackage;
  disabled?: boolean;
  onPress: () => void;
};

function pickPrimaryMeeting(pkg: EnrollmentPackage): ClassMeeting | undefined {
  const packageMeeting = pkg.classMeetings?.find(
    (meeting) => meeting.meetingType === "CLASS",
  );
  if (packageMeeting) {
    return packageMeeting;
  }

  for (const section of pkg.sections ?? []) {
    const sectionMeeting = section.classMeetings?.find(
      (meeting) => meeting.meetingType === "CLASS",
    );
    if (sectionMeeting) {
      return sectionMeeting;
    }
  }

  return pkg.classMeetings?.[0] ?? pkg.sections?.[0]?.classMeetings?.[0];
}

function formatMeetingSummary(pkg: EnrollmentPackage): string {
  const meeting = pickPrimaryMeeting(pkg);

  if (!meeting) {
    return "Time and location TBD";
  }

  const parts: string[] = [];

  if (meeting.meetingDays?.trim()) {
    parts.push(meeting.meetingDays.trim());
  }

  if (meeting.meetingTimeStart != null) {
    parts.push(formatMeetingTime(meeting.meetingTimeStart));
  }

  const location = formatLocation(meeting);
  if (location !== "Location TBD") {
    parts.push(location);
  }

  return parts.length > 0 ? parts.join(" · ") : "Time and location TBD";
}

export function SectionPickerRow({ pkg, disabled, onPress }: SectionPickerRowProps) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const meetingSummary = formatMeetingSummary(pkg);

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.sectionNumber, { color: colors.text }]}>
        Section {pkg.enrollmentClassNumber}
      </Text>
      <Text style={[styles.meeting, { color: colors.textMuted }]} numberOfLines={2}>
        {meetingSummary}
      </Text>
      {disabled ? (
        <Text style={[styles.added, { color: colors.textMuted }]}>Already in schedule</Text>
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
  cardDisabled: {
    opacity: 0.55,
  },
  sectionNumber: {
    fontSize: 17,
    fontWeight: "600",
  },
  meeting: {
    fontSize: 14,
  },
  added: {
    fontSize: 13,
    marginTop: 2,
    fontStyle: "italic",
  },
});
