import * as Location from "expo-location";
import { Platform } from "react-native";

import type { LocationAdapter, PermissionSnapshot, UserCoords } from "./types";

function toSnapshot(
  response: Location.LocationPermissionResponse,
): PermissionSnapshot {
  return {
    status: response.status,
    granted: response.granted,
    canAskAgain: response.canAskAgain,
  };
}

export const expoLocationAdapter: LocationAdapter = {
  isNativePlatform: Platform.OS === "ios" || Platform.OS === "android",

  async getForegroundPermissionsAsync() {
    return toSnapshot(await Location.getForegroundPermissionsAsync());
  },

  async requestForegroundPermissionsAsync() {
    return toSnapshot(await Location.requestForegroundPermissionsAsync());
  },

  async getCurrentPositionAsync(): Promise<UserCoords> {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  },

  async getProviderStatusAsync() {
    const status = await Location.getProviderStatusAsync();
    return { locationServicesEnabled: status.locationServicesEnabled };
  },
};
