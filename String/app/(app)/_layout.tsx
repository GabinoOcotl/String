import { Redirect, Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function AppGroupLayout() {
  const { session, initialized } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  if (!initialized) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: isDark ? colors.surface : colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600", color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
