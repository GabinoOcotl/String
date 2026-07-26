import {
  actionButtonTitle,
  locationBannerCopy,
  mapPermissionSnapshot,
} from "../mapPermissionState";

describe("mapPermissionSnapshot", () => {
  it("maps granted", () => {
    expect(
      mapPermissionSnapshot({
        status: "granted",
        granted: true,
        canAskAgain: true,
      }),
    ).toEqual({ kind: "granted" });
  });

  it("maps undetermined", () => {
    expect(
      mapPermissionSnapshot({
        status: "undetermined",
        granted: false,
        canAskAgain: true,
      }),
    ).toEqual({ kind: "undetermined" });
  });

  it("maps denied with canAskAgain as retryable", () => {
    expect(
      mapPermissionSnapshot({
        status: "denied",
        granted: false,
        canAskAgain: true,
      }),
    ).toEqual({ kind: "denied_retryable" });
  });

  it("maps permanently denied", () => {
    expect(
      mapPermissionSnapshot({
        status: "denied",
        granted: false,
        canAskAgain: false,
      }),
    ).toEqual({ kind: "denied_permanent" });
  });
});

describe("locationBannerCopy", () => {
  it("offers enable for undetermined", () => {
    expect(locationBannerCopy({ kind: "undetermined" })?.actionLabel).toBe(
      "enable",
    );
  });

  it("offers retry for denied_retryable", () => {
    expect(
      locationBannerCopy({ kind: "denied_retryable" })?.actionLabel,
    ).toBe("retry");
  });

  it("offers settings for denied_permanent", () => {
    expect(
      locationBannerCopy({ kind: "denied_permanent" })?.actionLabel,
    ).toBe("settings");
  });

  it("returns null for granted / unsupported / checking", () => {
    expect(locationBannerCopy({ kind: "granted" })).toBeNull();
    expect(locationBannerCopy({ kind: "unsupported" })).toBeNull();
    expect(locationBannerCopy({ kind: "checking" })).toBeNull();
  });

  it("titles match actions", () => {
    expect(actionButtonTitle("enable")).toBe("Enable my location");
    expect(actionButtonTitle("retry")).toBe("Try again");
    expect(actionButtonTitle("settings")).toBe("Open settings");
  });
});
