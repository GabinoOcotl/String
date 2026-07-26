# Campus route map setup

The Route screen uses [`react-native-maps`](https://docs.expo.dev/versions/v54.0.0/sdk/map-view/) (markers + ordered polyline) and [`expo-location`](https://docs.expo.dev/versions/v54.0.0/sdk/location/) for the optional user-location blue dot and **Center on me** control.

Location is an enhancement: class pins and the walking path still work if the user declines permission.

## Platforms

| Platform | Map provider | API key |
|----------|--------------|---------|
| iOS | Apple Maps (default) | Not required |
| Android | Google Maps | **Required** for store / EAS binaries |
| Web | List-only fallback | N/A |

## App identifiers

Checked-in package IDs (must match Google Cloud key restrictions):

| Platform | Identifier |
|----------|------------|
| Android | `com.gocotl.string` |
| iOS | `com.gocotl.string` |

## Google Maps API key (Android) — in-depth

### 1. Enable the SDK

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable **Maps SDK for Android**.

### 2. Get the signing SHA-1

**EAS development / preview builds**

1. Link the project and create credentials (first build generates them):
   ```bash
   npx eas-cli build --profile development --platform android
   ```
2. In [expo.dev](https://expo.dev) → project → **Credentials** → Android → keystore → copy **SHA-1 Certificate Fingerprint**.

**Google Play production**

1. Upload an AAB at least once (or use Play App Signing).
2. Play Console → **Release** → **Setup** → **App integrity** → **App signing** → copy the **SHA-1**.

Use **separate** API keys for development and production when practical.

### 3. Create and restrict the key

1. Credentials → **Create credentials** → **API key**.
2. Edit the key:
   - Application restrictions → **Android apps**
   - Add item: package `com.gocotl.string` + the matching SHA-1
   - API restrictions → restrict to **Maps SDK for Android**
3. Save.

The key is embedded in the APK. Restrictions (package + SHA-1 + API) are the security boundary — not Wrangler secrets.

### 4. Local `.env` (gitignored)

```bash
GOOGLE_MAPS_API_KEY=your_android_maps_key
```

`app.config.js` injects it into `android.config.googleMaps.apiKey` at prebuild time.

### 5. EAS environments

`eas.json` defines `development`, `preview`, and `production` profiles, each with a matching `environment`.

```bash
# Development key (dev SHA-1)
npx eas-cli env:create --name GOOGLE_MAPS_API_KEY --value "<dev-key>" --environment development --visibility secret

# Production key (Play App Signing SHA-1)
npx eas-cli env:create --name GOOGLE_MAPS_API_KEY --value "<prod-key>" --environment production --visibility secret
```

Or push from local `.env` (see [`deploy.md`](../../deploy.md)).

Android EAS builds **fail** if `GOOGLE_MAPS_API_KEY` is blank (`app.config.js` guard).

### 6. Build and verify

```bash
npx eas-cli build --profile development --platform android
# Install the APK, open Schedule → Route, confirm tiles + class markers load.
```

Verify checked-in config anytime:

```bash
npm run verify:android-maps
```

## Location permission (iOS / Android)

- Only **foreground / When In Use** is requested.
- The Route screen does **not** prompt on mount; the user taps **Enable my location**.
- If denied (retryable): banner + **Try again**.
- If permanently denied: banner + **Open settings**.
- Class map, polyline, and stop list stay visible in every denial state.
- Coordinates are never sent to the Worker, D1, R2, analytics, or logs.

## After config changes

Any change to `GOOGLE_MAPS_API_KEY`, `app.json` / `app.config.js` map settings, package IDs, or the `expo-location` plugin requires a **new native build** (`eas build` or `npx expo prebuild` + run), not just a Metro reload.
