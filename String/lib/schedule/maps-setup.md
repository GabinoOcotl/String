# Campus route map setup

The Route screen uses [`react-native-maps`](https://docs.expo.dev/versions/v54.0.0/sdk/map-view/) (markers + ordered polyline) and optional [`expo-location`](https://docs.expo.dev/versions/v54.0.0/sdk/location/) for the user location blue dot.

## Platforms

| Platform | Map provider | API key |
|----------|--------------|---------|
| iOS | Apple Maps (default) | Not required |
| Android | Google Maps | **Required** for store / EAS binaries |
| Web | List-only fallback | N/A |

## Google Maps API key (Android)

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and enable **Maps SDK for Android**.
2. Create an API key restricted to your Android package name + SHA-1 (debug keystore for local/EAS dev builds; Play App Signing SHA-1 for production).
3. Put the key in local `.env` (gitignored):

   ```bash
   GOOGLE_MAPS_API_KEY=your_android_maps_key
   ```

4. `app.config.js` injects it into `android.config.googleMaps.apiKey` at prebuild time. Rebuild the native binary after changing the key.

## EAS development builds

`react-native-maps` needs a native binary. Prefer an [EAS development build](https://docs.expo.dev/develop/development-builds/introduction/) over Expo Go for reliable map testing (especially Android Google Maps).

```bash
# One-time: create a development client
npx eas-cli build --profile development --platform android
# or ios
npx eas-cli build --profile development --platform ios
```

Store the Maps key as an EAS secret so CI/prebuild can read it:

```bash
npx eas-cli secret:create --name GOOGLE_MAPS_API_KEY --value "your_android_maps_key" --type string
```

Ensure your EAS build profile does not strip env vars needed by `app.config.js`.

## After config changes

Any change to `GOOGLE_MAPS_API_KEY`, `app.json` / `app.config.js` map settings, or the `expo-location` plugin requires a **new native build** (`eas build` or `npx expo prebuild` + run), not just a Metro reload.
