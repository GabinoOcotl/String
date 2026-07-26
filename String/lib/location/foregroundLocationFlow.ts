import { mapPermissionSnapshot } from "./mapPermissionState";
import type {
  ForegroundLocationUiState,
  LocationAdapter,
  UserCoords,
} from "./types";

export async function refreshForegroundLocation(
  adapter: LocationAdapter,
): Promise<ForegroundLocationUiState> {
  if (!adapter.isNativePlatform) {
    return { kind: "unsupported" };
  }

  try {
    const snapshot = await adapter.getForegroundPermissionsAsync();
    return mapPermissionSnapshot(snapshot);
  } catch (err) {
    return {
      kind: "error",
      message:
        err instanceof Error
          ? err.message
          : "Could not check location permission.",
    };
  }
}

export async function requestForegroundLocation(
  adapter: LocationAdapter,
): Promise<ForegroundLocationUiState> {
  if (!adapter.isNativePlatform) {
    return { kind: "unsupported" };
  }

  try {
    if (adapter.getProviderStatusAsync) {
      const provider = await adapter.getProviderStatusAsync();
      if (!provider.locationServicesEnabled) {
        return {
          kind: "services_off",
          message:
            "Location services are turned off on this device. Turn them on, then try again.",
        };
      }
    }

    const snapshot = await adapter.requestForegroundPermissionsAsync();
    return mapPermissionSnapshot(snapshot);
  } catch (err) {
    return {
      kind: "error",
      message:
        err instanceof Error
          ? err.message
          : "Could not request location permission.",
    };
  }
}

export async function resolveUserCoords(
  adapter: LocationAdapter,
): Promise<{ state: ForegroundLocationUiState; coords: UserCoords | null }> {
  if (!adapter.isNativePlatform) {
    return { state: { kind: "unsupported" }, coords: null };
  }

  try {
    if (adapter.getProviderStatusAsync) {
      const provider = await adapter.getProviderStatusAsync();
      if (!provider.locationServicesEnabled) {
        return {
          state: {
            kind: "services_off",
            message:
              "Location services are turned off on this device. Turn them on, then try again.",
          },
          coords: null,
        };
      }
    }

    const snapshot = await adapter.getForegroundPermissionsAsync();
    const state = mapPermissionSnapshot(snapshot);
    if (state.kind !== "granted") {
      return { state, coords: null };
    }

    const coords = await adapter.getCurrentPositionAsync();
    return { state, coords };
  } catch (err) {
    return {
      state: {
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Could not read your current location.",
      },
      coords: null,
    };
  }
}

/** True when class map / path UI must remain visible regardless of location state. */
export function classRouteRemainsVisible(
  state: ForegroundLocationUiState,
): boolean {
  void state;
  return true;
}
