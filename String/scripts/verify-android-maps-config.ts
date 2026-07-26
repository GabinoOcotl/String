/**
 * Verifies Android Maps release config is present in checked-in sources.
 *
 * Run: npx tsx --tsconfig tsconfig.json scripts/verify-android-maps-config.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const require = createRequire(import.meta.url);

type Check = { name: string; ok: boolean; detail?: string };

function assert(checks: Check[], name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
}

function main() {
  const checks: Check[] = [];

  const appJson = JSON.parse(readFileSync(join(root, "app.json"), "utf8")) as {
    expo: {
      android?: { package?: string };
      ios?: { bundleIdentifier?: string };
    };
  };

  assert(
    checks,
    "android.package is set",
    appJson.expo.android?.package === "com.gocotl.string",
    appJson.expo.android?.package,
  );
  assert(
    checks,
    "ios.bundleIdentifier is set",
    appJson.expo.ios?.bundleIdentifier === "com.gocotl.string",
    appJson.expo.ios?.bundleIdentifier,
  );

  const eas = JSON.parse(readFileSync(join(root, "eas.json"), "utf8")) as {
    build?: Record<string, { environment?: string; developmentClient?: boolean }>;
  };

  for (const profile of ["development", "preview", "production"] as const) {
    assert(
      checks,
      `eas.json has ${profile} profile`,
      Boolean(eas.build?.[profile]),
    );
    assert(
      checks,
      `eas.json ${profile} uses matching environment`,
      eas.build?.[profile]?.environment === profile,
      eas.build?.[profile]?.environment,
    );
  }

  assert(
    checks,
    "development profile enables developmentClient",
    eas.build?.development?.developmentClient === true,
  );

  const prevPlatform = process.env.EAS_BUILD_PLATFORM;
  const prevEas = process.env.EAS_BUILD;
  const prevKey = process.env.GOOGLE_MAPS_API_KEY;

  try {
    process.env.EAS_BUILD = "true";
    process.env.EAS_BUILD_PLATFORM = "android";
    delete process.env.GOOGLE_MAPS_API_KEY;

    let threw = false;
    try {
      // Fresh require so assertAndroidMapsKey runs with current env.
      delete require.cache[require.resolve("../app.config.js")];
      const configFactory = require("../app.config.js") as () => unknown;
      configFactory();
    } catch (err) {
      threw = err instanceof Error && err.message.includes("GOOGLE_MAPS_API_KEY");
    }

    assert(
      checks,
      "Android EAS build without Maps key throws",
      threw,
    );

    process.env.GOOGLE_MAPS_API_KEY = "test-android-maps-key";
    delete require.cache[require.resolve("../app.config.js")];
    const configFactory = require("../app.config.js") as () => {
      android?: { config?: { googleMaps?: { apiKey?: string } }; package?: string };
    };
    const config = configFactory();
    assert(
      checks,
      "Android EAS build with Maps key injects apiKey",
      config.android?.config?.googleMaps?.apiKey === "test-android-maps-key",
    );
    assert(
      checks,
      "Resolved config keeps android.package",
      config.android?.package === "com.gocotl.string",
    );
  } finally {
    if (prevPlatform === undefined) delete process.env.EAS_BUILD_PLATFORM;
    else process.env.EAS_BUILD_PLATFORM = prevPlatform;
    if (prevEas === undefined) delete process.env.EAS_BUILD;
    else process.env.EAS_BUILD = prevEas;
    if (prevKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = prevKey;
    delete require.cache[require.resolve("../app.config.js")];
  }

  const failed = checks.filter((c) => !c.ok);
  for (const check of checks) {
    const mark = check.ok ? "PASS" : "FAIL";
    const detail = check.detail ? ` (${check.detail})` : "";
    console.log(`${mark} ${check.name}${detail}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${checks.length} Android Maps config checks passed.`);
}

main();
