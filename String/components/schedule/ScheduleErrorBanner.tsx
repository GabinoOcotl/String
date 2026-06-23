import { StyleSheet, Text, useColorScheme } from "react-native";

import { themeColors } from "@/constants/theme";

export type ScheduleErrorBannerProps = {
  message: string;
};

export function ScheduleErrorBanner({ message }: ScheduleErrorBannerProps) {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <Text
      style={[styles.banner, { color: colors.error }]}
      accessibilityRole="alert"
    >
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
