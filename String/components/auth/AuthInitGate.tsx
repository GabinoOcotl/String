import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import type { ReactNode } from "react";

import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

type AuthInitGateProps = {
  children: ReactNode;
};

export function AuthInitGate({ children }: AuthInitGateProps) {
  const { initialized, initError, retryBootstrap } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  if (!initialized) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={[styles.centered, styles.padded, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="alert">
          Unable to start
        </Text>
        <Text style={[styles.message, { color: colors.textMuted }]}>{initError}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            pressed && styles.buttonPressed,
          ]}
          onPress={retryBootstrap}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  padded: {
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
