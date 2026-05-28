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
          tabBarIcon: ({ color, size, focused }) => (
            <AuthTabIcon
              sfSymbol={focused ? "calendar.circle.fill" : "calendar.circle"}
              materialName={focused ? "calendar-today" : "date-range"}
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
          tabBarIcon: ({ color, size, focused }) => (
            <AuthTabIcon
              sfSymbol={focused ? "message.fill" : "message"}
              materialName={focused ? "chat" : "chat-bubble-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
