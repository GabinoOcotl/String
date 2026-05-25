import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";

import { themeColors } from "@/constants/theme";

export type AuthPrimaryButtonProps = {
  label: string;
  loading: boolean;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
};

export function AuthPrimaryButton({
  label,
  loading,
  onPress,
  disabled = false,
}: AuthPrimaryButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = themeColors[isDark ? "dark" : "light"];
  const isDisabled = disabled || loading;

  function handlePress() {
    try {
      const result = onPress();
      if (result instanceof Promise) {
        void result.catch(() => {});
      }
    } catch {
      // Screen handlers should catch and surface errors; this avoids unhandled rejections.
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.primary },
        pressed && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 24,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
