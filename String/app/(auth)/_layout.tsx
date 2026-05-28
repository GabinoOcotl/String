import { Redirect, Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { AuthInitGate } from "@/components/auth/AuthInitGate";
import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthGroupLayout() {
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  return (
    <AuthInitGate>
      {session ? (
        <Redirect href="/schedule" />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      )}
    </AuthInitGate>
  );
}
