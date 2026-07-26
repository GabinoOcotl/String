import {
  classRouteRemainsVisible,
  refreshForegroundLocation,
  requestForegroundLocation,
  resolveUserCoords,
} from "../foregroundLocationFlow";
import type { LocationAdapter, PermissionSnapshot } from "../types";

function createAdapter(
  overrides: Partial<LocationAdapter> & {
    permission?: PermissionSnapshot;
  } = {},
): LocationAdapter & { getPositionCalls: number } {
  let permission: PermissionSnapshot = overrides.permission ?? {
    status: "undetermined",
    granted: false,
    canAskAgain: true,
  };
  let getPositionCalls = 0;

  const adapter: LocationAdapter & { getPositionCalls: number } = {
    isNativePlatform: overrides.isNativePlatform ?? true,
    getForegroundPermissionsAsync:
      overrides.getForegroundPermissionsAsync ??
      (async () => permission),
    requestForegroundPermissionsAsync:
      overrides.requestForegroundPermissionsAsync ??
      (async () => {
        permission = {
          status: "granted",
          granted: true,
          canAskAgain: true,
        };
        return permission;
      }),
    getCurrentPositionAsync:
      overrides.getCurrentPositionAsync ??
      (async () => {
        getPositionCalls += 1;
        adapter.getPositionCalls = getPositionCalls;
        return { latitude: 43.07, longitude: -89.4 };
      }),
    getProviderStatusAsync:
      overrides.getProviderStatusAsync ??
      (async () => ({ locationServicesEnabled: true })),
    getPositionCalls: 0,
  };

  return adapter;
}

describe("foregroundLocationFlow", () => {
  it("returns unsupported on web", async () => {
    const adapter = createAdapter({ isNativePlatform: false });
    await expect(refreshForegroundLocation(adapter)).resolves.toEqual({
      kind: "unsupported",
    });
  });

  it("refreshes undetermined without prompting", async () => {
    const request = jest.fn();
    const adapter = createAdapter({
      permission: {
        status: "undetermined",
        granted: false,
        canAskAgain: true,
      },
      requestForegroundPermissionsAsync: request,
    });

    await expect(refreshForegroundLocation(adapter)).resolves.toEqual({
      kind: "undetermined",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("requests permission and maps grant", async () => {
    const adapter = createAdapter();
    await expect(requestForegroundLocation(adapter)).resolves.toEqual({
      kind: "granted",
    });
  });

  it("maps retryable denial after request", async () => {
    const adapter = createAdapter({
      requestForegroundPermissionsAsync: async () => ({
        status: "denied",
        granted: false,
        canAskAgain: true,
      }),
    });
    await expect(requestForegroundLocation(adapter)).resolves.toEqual({
      kind: "denied_retryable",
    });
  });

  it("maps permanent denial after request", async () => {
    const adapter = createAdapter({
      requestForegroundPermissionsAsync: async () => ({
        status: "denied",
        granted: false,
        canAskAgain: false,
      }),
    });
    await expect(requestForegroundLocation(adapter)).resolves.toEqual({
      kind: "denied_permanent",
    });
  });

  it("detects location services off", async () => {
    const adapter = createAdapter({
      getProviderStatusAsync: async () => ({
        locationServicesEnabled: false,
      }),
    });
    const state = await requestForegroundLocation(adapter);
    expect(state.kind).toBe("services_off");
  });

  it("surfaces permission API errors", async () => {
    const adapter = createAdapter({
      getForegroundPermissionsAsync: async () => {
        throw new Error("permission boom");
      },
    });
    await expect(refreshForegroundLocation(adapter)).resolves.toEqual({
      kind: "error",
      message: "permission boom",
    });
  });

  it("grant → revoke on refresh (lifecycle)", async () => {
    let permission: PermissionSnapshot = {
      status: "granted",
      granted: true,
      canAskAgain: true,
    };
    const adapter = createAdapter({
      getForegroundPermissionsAsync: async () => permission,
    });

    await expect(refreshForegroundLocation(adapter)).resolves.toEqual({
      kind: "granted",
    });

    permission = {
      status: "denied",
      granted: false,
      canAskAgain: false,
    };

    await expect(refreshForegroundLocation(adapter)).resolves.toEqual({
      kind: "denied_permanent",
    });
  });

  it("centerOnUser only reads GPS when granted", async () => {
    const denied = createAdapter({
      permission: {
        status: "denied",
        granted: false,
        canAskAgain: true,
      },
    });
    const deniedResult = await resolveUserCoords(denied);
    expect(deniedResult.coords).toBeNull();
    expect(denied.getPositionCalls).toBe(0);

    const granted = createAdapter({
      permission: {
        status: "granted",
        granted: true,
        canAskAgain: true,
      },
    });
    const grantedResult = await resolveUserCoords(granted);
    expect(grantedResult.coords).toEqual({
      latitude: 43.07,
      longitude: -89.4,
    });
    expect(granted.getPositionCalls).toBe(1);
  });

  it("keeps class route visible for every location state", () => {
    const states = [
      { kind: "unsupported" as const },
      { kind: "checking" as const },
      { kind: "undetermined" as const },
      { kind: "granted" as const },
      { kind: "denied_retryable" as const },
      { kind: "denied_permanent" as const },
      { kind: "services_off" as const, message: "off" },
      { kind: "error" as const, message: "err" },
    ];
    for (const state of states) {
      expect(classRouteRemainsVisible(state)).toBe(true);
    }
  });
});
