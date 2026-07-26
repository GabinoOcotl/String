export type PermissionStatusValue =
  | "undetermined"
  | "granted"
  | "denied";

export type PermissionSnapshot = {
  status: PermissionStatusValue;
  granted: boolean;
  canAskAgain: boolean;
};

/**
 * UI-facing foreground location states for the Route screen.
 * Location is optional — class pins and the walking path always remain available.
 */
export type ForegroundLocationUiState =
  | { kind: "unsupported" }
  | { kind: "checking" }
  | { kind: "undetermined" }
  | { kind: "granted" }
  | { kind: "denied_retryable" }
  | { kind: "denied_permanent" }
  | { kind: "services_off"; message: string }
  | { kind: "error"; message: string };

export type UserCoords = {
  latitude: number;
  longitude: number;
};

export type LocationAdapter = {
  isNativePlatform: boolean;
  getForegroundPermissionsAsync: () => Promise<PermissionSnapshot>;
  requestForegroundPermissionsAsync: () => Promise<PermissionSnapshot>;
  getCurrentPositionAsync: () => Promise<UserCoords>;
  getProviderStatusAsync?: () => Promise<{ locationServicesEnabled: boolean }>;
};
