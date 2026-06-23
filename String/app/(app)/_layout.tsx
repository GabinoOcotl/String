import { Redirect, Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { AuthInitGate } from "@/components/auth/AuthInitGate";
import { themeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { ScheduleProvider } from "@/contexts/ScheduleContext";

export default function AppGroupLayout() {
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];

  return (
    <AuthInitGate>
      {!session ? (
        <Redirect href="/login" />
      ) : (
        <ScheduleProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
        </ScheduleProvider>
      )}
    </AuthInitGate>
  );
}
