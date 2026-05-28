import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { themeColors } from "@/constants/theme";

import { getThreadTitle } from "@/lib/chats/threads";

export default function ChatsStackLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: isDark ? colors.surface : colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600", color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Chats" }} />
      <Stack.Screen
        name="[threadId]"
        options={({ route }) => {
          const threadId = (route.params as { threadId?: string } | undefined)?.threadId;
          return { title: getThreadTitle(threadId) };
        }}
      />
    </Stack>
  );
}
