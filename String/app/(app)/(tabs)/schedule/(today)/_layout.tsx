import { DrawerToggleButton } from "@react-navigation/drawer";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { themeColors } from "@/constants/theme";

export default function TodayStackLayout() {
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
      <Stack.Screen
        name="index"
        options={{
          title: "Today",
          headerLeft: () => <DrawerToggleButton />,
        }}
      />
      <Stack.Screen
        name="[classId]"
        options={{
          title: "Class",
        }}
      />
    </Stack>
  );
}
