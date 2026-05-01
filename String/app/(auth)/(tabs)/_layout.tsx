import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

import { themeColors } from "@/constants/theme";

export default function AuthTabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 13 },
      }}
    >
      <Tabs.Screen name="login" options={{ title: "Sign in" }} />
      <Tabs.Screen name="signup" options={{ title: "Sign up" }} />
    </Tabs>
  );
}
