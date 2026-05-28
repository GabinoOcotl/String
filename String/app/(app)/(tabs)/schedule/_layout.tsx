import { DrawerToggleButton } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { useColorScheme, useWindowDimensions } from "react-native";

import { themeColors } from "@/constants/theme";

export default function ScheduleDrawerLayout() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];
  const drawerWidth = Math.min(280, Math.max(220, width * 0.60));

  return (
    <Drawer
      initialRouteName="(today)"
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: isDark ? colors.surface : colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600", color: colors.text },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textMuted,
        drawerStyle: { backgroundColor: colors.surface, width: drawerWidth },
        drawerLabelStyle: { fontWeight: "600", fontSize: 15 },
      }}
    >
      <Drawer.Screen
        name="(today)"
        options={{
          drawerLabel: "Today",
          title: "Today",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="map"
        options={{
          drawerLabel: "Route",
          title: "Route",
          headerLeft: () => <DrawerToggleButton />,
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "Profile",
          title: "Profile",
          headerLeft: () => <DrawerToggleButton />,
        }}
      />
    </Drawer>
  );
}
