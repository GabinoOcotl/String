import { Redirect, Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthGroupLayout() {
  const { session, initialized } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  if (!initialized) {
    return null;
  }

  if (session) {
    return <Redirect href="/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
