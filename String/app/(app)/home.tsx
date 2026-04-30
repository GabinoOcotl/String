import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export const options = {
  title: "Home",
};

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  async function onSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>You&apos;re signed in</Text>
      <Text style={[styles.email, { color: colors.textMuted }]}>
        {user?.email ?? "Signed in"}
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { borderColor: colors.border },
          pressed && styles.buttonPressed,
        ]}
        onPress={onSignOut}
      >
        <Text style={[styles.buttonText, { color: colors.primary }]}>
          Sign out
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
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
