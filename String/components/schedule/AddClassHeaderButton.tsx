import { HeaderButton, type HeaderButtonProps } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { StyleSheet, useColorScheme, View } from "react-native";

import { themeColors } from "@/constants/theme";

const CIRCLE_SIZE = 24;
const BAR_LENGTH = 10;
const BAR_THICKNESS = 2;

type AddClassHeaderButtonProps = Omit<HeaderButtonProps, "children"> & {
  canGoBack?: boolean;
};

export function AddClassHeaderButton({
  tintColor,
  canGoBack: _canGoBack,
  ...rest
}: AddClassHeaderButtonProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const color = tintColor ?? colors.text;

  return (
    <HeaderButton
      {...rest}
      accessibilityLabel="Add class"
      onPress={() => router.push("/schedule/(today)/add-class")}
    >
      <View style={[styles.circle, { borderColor: color }]}>
        <View style={[styles.bar, styles.barHorizontal, { backgroundColor: color }]} />
        <View style={[styles.bar, styles.barVertical, { backgroundColor: color }]} />
      </View>
    </HeaderButton>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    marginHorizontal: 5,
  },
  bar: {
    position: "absolute",
    borderRadius: BAR_THICKNESS / 2,
  },
  barHorizontal: {
    width: BAR_LENGTH,
    height: BAR_THICKNESS,
  },
  barVertical: {
    width: BAR_THICKNESS,
    height: BAR_LENGTH,
  },
});
