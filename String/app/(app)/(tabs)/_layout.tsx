import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

import { AuthTabIcon } from "@/components/auth/AuthTabIcon";
import { themeColors } from "@/constants/theme";

export default function AppTabsLayout() {
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
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <AuthTabIcon
              sfSymbol="calendar"
              materialName="calendar-today"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <AuthTabIcon
              sfSymbol="message.fill"
              materialName="chat"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
