// Merges app.json with env-backed Google Maps key for EAS / local prebuild.
// Set GOOGLE_MAPS_API_KEY in .env (local) or as an EAS secret (CI builds).
const appJson = require("./app.json");

/**
 * Fail fast when an Android EAS/native build would embed a blank Maps key.
 * Local `expo start` / web remain allowed without the key.
 */
function assertAndroidMapsKey(apiKey) {
  const key = typeof apiKey === "string" ? apiKey.trim() : "";
  const platform = (process.env.EAS_BUILD_PLATFORM ?? "").toLowerCase();
  const isAndroidEasBuild =
    process.env.EAS_BUILD === "true" && platform === "android";

  if (isAndroidEasBuild && !key) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is required for Android EAS builds. " +
        "Set it in the matching EAS environment (development/preview/production) " +
        "or in local .env before prebuild. See lib/schedule/maps-setup.md.",
    );
  }
}

/** @type {() => import('expo/config').ExpoConfig} */
module.exports = () => {
  const expo = appJson.expo;
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";

  assertAndroidMapsKey(googleMapsApiKey);

  return {
    ...expo,
    android: {
      ...expo.android,
      package: expo.android?.package ?? "com.gocotl.string",
      config: {
        ...(expo.android?.config ?? {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...expo.ios,
      bundleIdentifier: expo.ios?.bundleIdentifier ?? "com.gocotl.string",
    },
    plugins: [
      ...(expo.plugins ?? []),
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Allow String to show your location on the campus walking route.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow String to choose a photo for your profile.",
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
    ],
  };
};
