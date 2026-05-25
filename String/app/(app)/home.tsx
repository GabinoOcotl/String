import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { GENERIC_AUTH_ERROR, mapAuthError } from "@/lib/authErrors";

export const options = {
  title: "Home",
};

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignOut() {
    setError(null);
    setLoading(true);
    try {
      const { error: signOutError } = await signOut();
      if (signOutError) {
        setError(mapAuthError(signOutError));
        return;
      }
      router.replace("/login");
    } catch {
      setError(GENERIC_AUTH_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>You&apos;re signed in</Text>
      <Text style={[styles.email, { color: colors.textMuted }]}>
        {user?.email ?? "Signed in"}
      </Text>

      {error ? (
        <Text style={[styles.error, { color: colors.error }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { borderColor: colors.border },
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
        onPress={onSignOut}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: colors.primary }]}>
          {loading ? "Signing out..." : "Sign out"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  email: {
    marginTop: 8,
    fontSize: 16,
    textAlign: "center",
  },
  error: {
    marginTop: 16,
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
