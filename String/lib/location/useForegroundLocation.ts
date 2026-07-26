import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus, Linking } from "react-native";

import { expoLocationAdapter } from "./expoLocationAdapter";
import {
  refreshForegroundLocation,
  requestForegroundLocation,
  resolveUserCoords,
} from "./foregroundLocationFlow";
import type {
  ForegroundLocationUiState,
  LocationAdapter,
  UserCoords,
} from "./types";

export type UseForegroundLocationResult = {
  state: ForegroundLocationUiState;
  showUserLocation: boolean;
  refresh: () => Promise<void>;
  requestPermission: () => Promise<void>;
  openSettings: () => void;
  centerOnUser: () => Promise<UserCoords | null>;
  centering: boolean;
};

/**
 * Foreground location for the Route screen.
 * Does not prompt on mount — call `requestPermission` from a user gesture.
 */
export function useForegroundLocation(
  adapter: LocationAdapter = expoLocationAdapter,
): UseForegroundLocationResult {
  const [state, setState] = useState<ForegroundLocationUiState>(() =>
    adapter.isNativePlatform ? { kind: "checking" } : { kind: "unsupported" },
  );
  const [centering, setCentering] = useState(false);
  const adapterRef = useRef(adapter);
  adapterRef.current = adapter;

  const refresh = useCallback(async () => {
    setState(await refreshForegroundLocation(adapterRef.current));
  }, []);

  const requestPermission = useCallback(async () => {
    setState(await requestForegroundLocation(adapterRef.current));
  }, []);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const centerOnUser = useCallback(async (): Promise<UserCoords | null> => {
    setCentering(true);
    try {
      const result = await resolveUserCoords(adapterRef.current);
      setState(result.state);
      return result.coords;
    } finally {
      setCentering(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!adapter.isNativePlatform) {
      return;
    }

    const onChange = (next: AppStateStatus) => {
      if (next === "active") {
        void refresh();
      }
    };

    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [adapter.isNativePlatform, refresh]);

  return {
    state,
    showUserLocation: state.kind === "granted",
    refresh,
    requestPermission,
    openSettings,
    centerOnUser,
    centering,
  };
}
