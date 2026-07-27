import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { RoomDetailsHeaderButton } from "@/components/chats/RoomDetailsHeaderButton";
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
          const params = route.params as
            | { threadId?: string; name?: string }
            | undefined;
          const threadId = params?.threadId;
          return {
            title: getThreadTitle(params?.threadId, params?.name),
            // iOS uses this screen's title as the next screen's back label;
            // long course names become a huge text button without this.
            headerBackTitle: "Back",
            headerRight: threadId
              ? (props) => (
                  <RoomDetailsHeaderButton
                    {...props}
                    roomId={threadId}
                    roomName={params?.name}
                  />
                )
              : undefined,
          };
        }}
      />
      <Stack.Screen
        name="room-details"
        options={({ route }) => {
          const params = route.params as { name?: string } | undefined;
          const name = params?.name?.trim();
          return {
            title: name || "Room details",
            headerBackButtonDisplayMode: "minimal",
          };
        }}
      />
      <Stack.Screen
        name="profile/[userId]"
        options={{
          title: "Profile",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}
