// Merges app.json with env-backed Google Maps key for EAS / local prebuild.
// Set GOOGLE_MAPS_API_KEY in .env (local) or as an EAS secret (CI builds).
const appJson = require("./app.json");

/** @type {() => import('expo/config').ExpoConfig} */
module.exports = () => {
  const expo = appJson.expo;

  return {
    ...expo,
    android: {
      ...expo.android,
      config: {
        ...(expo.android?.config ?? {}),
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
        },
      },
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
    ],
  };
};
