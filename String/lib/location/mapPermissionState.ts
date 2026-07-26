import type {
  ForegroundLocationUiState,
  PermissionSnapshot,
} from "./types";

/**
 * Pure mapping from expo-location permission responses → Route UI state.
 * Kept free of React / native modules so it can be unit-tested.
 */
export function mapPermissionSnapshot(
  snapshot: PermissionSnapshot,
): Exclude<
  ForegroundLocationUiState,
  { kind: "unsupported" } | { kind: "checking" } | { kind: "services_off" } | { kind: "error" }
> {
  if (snapshot.granted || snapshot.status === "granted") {
    return { kind: "granted" };
  }

  if (snapshot.status === "undetermined") {
    return { kind: "undetermined" };
  }

  if (snapshot.canAskAgain) {
    return { kind: "denied_retryable" };
  }

  return { kind: "denied_permanent" };
}

export function locationBannerCopy(
  state: ForegroundLocationUiState,
): { message: string; actionLabel?: "enable" | "retry" | "settings" } | null {
  switch (state.kind) {
    case "undetermined":
      return {
        message: "Show your position on the campus map to orient yourself.",
        actionLabel: "enable",
      };
    case "denied_retryable":
      return {
        message:
          "Location is off for String. Class stops still work — enable location to see yourself on the map.",
        actionLabel: "retry",
      };
    case "denied_permanent":
      return {
        message:
          "Location access is blocked. Open Settings to enable it, or keep using class stops without your position.",
        actionLabel: "settings",
      };
    case "services_off":
      return {
        message: state.message,
        actionLabel: "retry",
      };
    case "error":
      return {
        message: state.message,
        actionLabel: "retry",
      };
    default:
      return null;
  }
}

export function actionButtonTitle(
  label: "enable" | "retry" | "settings",
): string {
  switch (label) {
    case "enable":
      return "Enable my location";
    case "retry":
      return "Try again";
    case "settings":
      return "Open settings";
  }
}
