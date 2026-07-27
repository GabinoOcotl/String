import Ionicons from "@expo/vector-icons/Ionicons";
import { HeaderButton, type HeaderButtonProps } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { StyleSheet, useColorScheme, View } from "react-native";

import { themeColors } from "@/constants/theme";

const ICON_SIZE = 24;

type RoomDetailsHeaderButtonProps = Omit<HeaderButtonProps, "children"> & {
  roomId: string;
  roomName?: string;
  canGoBack?: boolean;
};

export function RoomDetailsHeaderButton({
  roomId,
  roomName,
  tintColor,
  canGoBack: _canGoBack,
  ...rest
}: RoomDetailsHeaderButtonProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const color = tintColor ?? colors.text;

  return (
    <HeaderButton
      {...rest}
      accessibilityLabel="Room details"
      onPress={() => {
        if (!roomId) return;
        router.push({
          pathname: "/chats/room-details",
          params: {
            roomId,
            ...(roomName ? { name: roomName } : {}),
          },
        });
      }}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="information-circle-outline" size={ICON_SIZE} color={color} />
      </View>
    </HeaderButton>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    marginHorizontal: 5,
  },
});
