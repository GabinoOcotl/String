import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  actionButtonTitle,
  locationBannerCopy,
} from "@/lib/location/mapPermissionState";
import type { ForegroundLocationUiState } from "@/lib/location/types";

type Props = {
  state: ForegroundLocationUiState;
  colors: {
    text: string;
    textMuted: string;
    surface: string;
    border: string;
    primary: string;
    onPrimary: string;
    error: string;
  };
  onEnable: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  onCenter: () => void;
  centering: boolean;
};

export function LocationPermissionBanner({
  state,
  colors,
  onEnable,
  onRetry,
  onOpenSettings,
  onCenter,
  centering,
}: Props) {
  if (state.kind === "unsupported" || state.kind === "checking") {
    return null;
  }

  if (state.kind === "granted") {
    return (
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Center map on my location"
          onPress={onCenter}
          disabled={centering}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: pressed || centering ? 0.75 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {centering ? "Locating…" : "Center on me"}
          </Text>
        </Pressable>
      </View>
    );
  }

  const copy = locationBannerCopy(state);
  if (!copy) {
    return null;
  }

  const onPress =
    copy.actionLabel === "enable"
      ? onEnable
      : copy.actionLabel === "settings"
        ? onOpenSettings
        : onRetry;

  const isErrorish =
    state.kind === "error" ||
    state.kind === "services_off" ||
    state.kind === "denied_permanent" ||
    state.kind === "denied_retryable";

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      accessibilityRole="summary"
    >
      <Text
        style={[
          styles.message,
          { color: isErrorish ? colors.error : colors.textMuted },
        ]}
      >
        {copy.message}
      </Text>
      {copy.actionLabel ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {actionButtonTitle(copy.actionLabel)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    marginTop: 8,
    flexDirection: "row",
  },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
