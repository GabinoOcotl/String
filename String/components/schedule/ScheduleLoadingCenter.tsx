import { ActivityIndicator, StyleSheet, useColorScheme, View } from "react-native";

import { themeColors } from "@/constants/theme";

export function ScheduleLoadingCenter() {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
