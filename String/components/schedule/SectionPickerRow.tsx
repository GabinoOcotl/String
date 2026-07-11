import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import { themeColors } from "@/constants/theme";
import type { ClassMeeting, EnrollmentPackage } from "@/lib/api/types/enrollment";
import {
  formatLocation,
  formatMeetingTime,
  formatSectionHeader,
} from "@/lib/schedule/mapSections";

export type SectionRowState = "available" | "added" | "blocked";

export type SectionPickerRowProps = {
  pkg: EnrollmentPackage;
  state: SectionRowState;
  blockedMessage?: string;
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

export function SectionPickerRow({
  pkg,
  state,
  blockedMessage,
  onPress,
}: SectionPickerRowProps) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const meetingSummary = formatMeetingSummary(pkg);
  const disabled = state !== "available";

  return (
    <Pressable disabled={disabled} onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            state === "blocked" && styles.cardBlocked,
            state === "added" && styles.cardAdded,
            pressed && state === "available" && styles.cardPressed,
          ]}
        >
          <View style={styles.row}>
            <View style={styles.content}>
              <Text style={[styles.sectionNumber, { color: colors.text }]}>
                {formatSectionHeader(pkg)}
              </Text>
              <Text style={[styles.meeting, { color: colors.textMuted }]} numberOfLines={2}>
                {meetingSummary}
              </Text>
              {state === "added" ? (
                <View style={styles.statusRow}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.textMuted} />
                  <Text style={[styles.statusText, { color: colors.textMuted }]}>
                    In your schedule
                  </Text>
                </View>
              ) : null}
              {state === "blocked" && blockedMessage ? (
                <Text style={[styles.statusText, { color: colors.textMuted }]}>
                  {blockedMessage}
                </Text>
              ) : null}
            </View>
            {state === "available" ? (
              <View
                style={[
                  styles.addIconWrap,
                  { borderColor: colors.primary },
                  pressed && { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons
                  name="add"
                  size={22}
                  color={pressed ? colors.onPrimary : colors.primary}
                />
              </View>
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  addIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardBlocked: {
    opacity: 0.55,
  },
  cardAdded: {
    opacity: 0.7,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statusText: {
    fontSize: 13,
    marginTop: 2,
    fontStyle: "italic",
    flexShrink: 1,
  },
  sectionNumber: {
    fontSize: 17,
    fontWeight: "600",
  },
  meeting: {
    fontSize: 14,
  },
});
