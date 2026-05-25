import type { ErrorBoundaryProps } from "expo-router";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import { themeColors } from "@/constants/theme";

export function RootErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="alert">
        Something went wrong
      </Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>
        {error.message || "An unexpected error occurred."}
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary },
          pressed && styles.buttonPressed,
        ]}
        onPress={retry}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  button: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
