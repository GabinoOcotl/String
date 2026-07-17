/**
 * Verification: day filter, coordinate pins, and Route ordering
 * against live UW enrollment package fixtures.
 *
 * Run: npx tsx --tsconfig tsconfig.json scripts/verify-day-and-route.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  CourseSearchHit,
  EnrollmentPackage,
} from "../lib/api/types/enrollment";
import { scheduleClassFromPackage } from "../lib/schedule/mapSections";
import {
  classesForWeekday,
  classMeetsOnWeekday,
  compareByNameThenTime,
  migrateScheduleClass,
  parseMeetingWeekdays,
} from "../lib/schedule/meetingDays";
import { buildRouteStops, hasValidCoords } from "../lib/schedule/routeStops";
import type { ScheduleClass } from "../lib/schedule/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "..", "lib", "schedule", "__fixtures__");

type Check = { name: string; ok: boolean; detail?: string };

function loadPackages(filename: string): EnrollmentPackage[] {
  const raw = readFileSync(join(fixturesDir, filename), "utf8");
  const data = JSON.parse(raw) as EnrollmentPackage[];
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Expected non-empty package array in ${filename}`);
  }
  return data;
}

function hitFromPackage(pkg: EnrollmentPackage, designation: string): CourseSearchHit {
  return {
    termCode: pkg.termCode,
    courseId: pkg.courseId,
    subject: {
      termCode: pkg.termCode,
      subjectCode: pkg.subjectCode,
      description: designation,
      shortDescription: designation,
      formalDescription: designation,
    },
    catalogNumber: pkg.catalogNumber,
    title: designation,
    courseDesignation: designation,
    fullCourseDesignation: designation,
  };
}

function pickDistinctPackages(
  packages: EnrollmentPackage[],
  count: number,
  preferUniqueBuildings = true,
): EnrollmentPackage[] {
  const picked: EnrollmentPackage[] = [];
  const seenBuildings = new Set<string>();

  for (const pkg of packages) {
    const meeting =
      pkg.classMeetings?.find((m) => m.meetingType === "CLASS") ??
      pkg.sections
        ?.flatMap((s) => s.classMeetings ?? [])
        .find((m) => m.meetingType === "CLASS");
    const buildingKey =
      meeting?.building?.buildingName ??
      `${meeting?.building?.latitude},${meeting?.building?.longitude}`;

    if (preferUniqueBuildings && buildingKey && seenBuildings.has(buildingKey)) {
      continue;
    }
    if (buildingKey) {
      seenBuildings.add(buildingKey);
    }
    picked.push(pkg);
    if (picked.length >= count) {
      break;
    }
  }

  if (picked.length < count) {
    for (const pkg of packages) {
      if (picked.includes(pkg)) {
        continue;
      }
      picked.push(pkg);
      if (picked.length >= count) {
        break;
      }
    }
  }

  return picked;
}

function assert(checks: Check[], name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
}

function main() {
  const checks: Check[] = [];

  const mathPkgs = loadPackages("uw-math112-packages.json");
  const csPkgs = loadPackages("uw-compsci300-packages.json");

  const mathPicked = pickDistinctPackages(mathPkgs, 3);
  const csPicked = pickDistinctPackages(csPkgs, 1);

  const schedule: ScheduleClass[] = [
    ...mathPicked.map((pkg) =>
      scheduleClassFromPackage(hitFromPackage(pkg, "MATH 112"), pkg),
    ),
    ...csPicked.map((pkg) =>
      scheduleClassFromPackage(hitFromPackage(pkg, "COMP SCI 300"), pkg),
    ),
  ];

  console.log("Mapped schedule classes:");
  for (const klass of schedule) {
    console.log(
      `  - ${klass.name} days=${klass.meetingDays} weekdays=[${klass.meetingWeekdays}] ` +
        `startMs=${klass.meetingTimeStartMs} ` +
        `bldg=${klass.buildingName ?? "?"} ` +
        `lat=${klass.latitude ?? "null"} lng=${klass.longitude ?? "null"}`,
    );
  }

  // --- Day filter: TR meets Tue/Thu only ---
  const trClass = schedule.find((c) => c.meetingDays === "TR");
  assert(checks, "MATH 112 package mapped with meetingDays TR", Boolean(trClass));
  if (trClass) {
    assert(
      checks,
      "TR → weekdays [2,4] (Tue/Thu)",
      JSON.stringify(trClass.meetingWeekdays) === JSON.stringify([2, 4]),
      `got ${JSON.stringify(trClass.meetingWeekdays)}`,
    );
    assert(checks, "TR meets Tuesday", classMeetsOnWeekday(trClass, 2));
    assert(checks, "TR meets Thursday", classMeetsOnWeekday(trClass, 4));
    assert(checks, "TR does NOT meet Wednesday", !classMeetsOnWeekday(trClass, 3));
    assert(checks, "TR does NOT meet Monday", !classMeetsOnWeekday(trClass, 1));
  }

  // --- Day filter: MWF meets Mon/Wed/Fri only ---
  const mwfClass = schedule.find((c) => c.meetingDays === "MWF");
  assert(checks, "COMP SCI 300 package mapped with meetingDays MWF", Boolean(mwfClass));
  if (mwfClass) {
    assert(
      checks,
      "MWF → weekdays [1,3,5]",
      JSON.stringify(mwfClass.meetingWeekdays) === JSON.stringify([1, 3, 5]),
      `got ${JSON.stringify(mwfClass.meetingWeekdays)}`,
    );
    assert(checks, "MWF meets Monday", classMeetsOnWeekday(mwfClass, 1));
    assert(checks, "MWF meets Wednesday", classMeetsOnWeekday(mwfClass, 3));
    assert(checks, "MWF does NOT meet Tuesday", !classMeetsOnWeekday(mwfClass, 2));
  }

  // --- Day mode list: Tuesday has TR only; Wednesday has MWF only ---
  const tuesday = classesForWeekday(schedule, 2);
  const wednesday = classesForWeekday(schedule, 3);
  assert(
    checks,
    "Tuesday day-list includes only TR classes",
    tuesday.length > 0 && tuesday.every((c) => c.meetingDays === "TR"),
    `count=${tuesday.length} days=${tuesday.map((c) => c.meetingDays).join(",")}`,
  );
  assert(
    checks,
    "Wednesday day-list includes only MWF classes",
    wednesday.length > 0 && wednesday.every((c) => c.meetingDays === "MWF"),
    `count=${wednesday.length} days=${wednesday.map((c) => c.meetingDays).join(",")}`,
  );
  assert(
    checks,
    "All mode still has every class (exclusive Day|All)",
    [...schedule].sort(compareByNameThenTime).length === schedule.length,
  );

  // --- Coordinate pins from real UW building payloads ---
  const withPins = schedule.filter(hasValidCoords);
  assert(
    checks,
    "Real UW packages yield latitude/longitude pins",
    withPins.length === schedule.length,
    `${withPins.length}/${schedule.length} have coords`,
  );
  const vanVleck = schedule.find((c) => c.buildingName === "Van Vleck Hall");
  assert(
    checks,
    "Van Vleck Hall pin near campus (~43.07, -89.40)",
    Boolean(
      vanVleck &&
        vanVleck.latitude != null &&
        vanVleck.longitude != null &&
        Math.abs(vanVleck.latitude - 43.0748) < 0.01 &&
        Math.abs(vanVleck.longitude - -89.4049) < 0.01,
    ),
    vanVleck
      ? `lat=${vanVleck.latitude} lng=${vanVleck.longitude}`
      : "Van Vleck not in picked set",
  );

  // --- Missing coords: listed on schedule, omitted from route with count ---
  const noCoord: ScheduleClass = {
    ...schedule[0],
    id: "no-coord-test",
    name: "ONLINE 101",
    latitude: null,
    longitude: null,
    buildingName: undefined,
    location: "Online",
    meetingDays: "TR",
    meetingWeekdays: [2, 4],
  };
  const tuesdayWithMissing = classesForWeekday([...schedule, noCoord], 2);
  assert(
    checks,
    "Class without coords still appears in day list",
    tuesdayWithMissing.some((c) => c.id === "no-coord-test"),
  );
  const {
    stops: tueStops,
    missingCoordCount,
    unmappedClasses,
  } = buildRouteStops(tuesdayWithMissing);
  assert(
    checks,
    "Route omits classes lacking coords and reports missing count",
    missingCoordCount >= 1 &&
      unmappedClasses.some((c) => c.id === "no-coord-test") &&
      !tueStops.some((s) => s.classes.some((c) => c.id === "no-coord-test")),
    `missing=${missingCoordCount} unmapped=${unmappedClasses.length} stops=${tueStops.length}`,
  );

  // --- Route ordering: sorted by start time; consecutive same building merged ---
  const early = {
    ...schedule[0],
    id: "early",
    name: "EARLY 100",
    meetingTimeStartMs: 36_000_000,
    startTime: "10:00 AM",
    meetingDays: "TR",
    meetingWeekdays: [2, 4],
    latitude: 43.0748,
    longitude: -89.4049,
    buildingName: "Van Vleck Hall",
  };
  const midSameBldg = {
    ...schedule[0],
    id: "mid-same",
    name: "MID 200",
    meetingTimeStartMs: 43_200_000,
    startTime: "12:00 PM",
    meetingDays: "TR",
    meetingWeekdays: [2, 4],
    latitude: 43.0748,
    longitude: -89.4049,
    buildingName: "Van Vleck Hall",
  };
  const lateOther = {
    ...schedule[0],
    id: "late",
    name: "LATE 300",
    meetingTimeStartMs: 50_400_000,
    startTime: "2:00 PM",
    meetingDays: "TR",
    meetingWeekdays: [2, 4],
    latitude: 43.0715,
    longitude: -89.4065,
    buildingName: "Computer Sciences",
  };
  const orderedDay = classesForWeekday([lateOther, early, midSameBldg], 2);
  assert(
    checks,
    "Day list sorts by meetingTimeStartMs",
    orderedDay.map((c) => c.id).join(",") === "early,mid-same,late",
    orderedDay.map((c) => c.id).join(","),
  );
  const { stops: orderedStops } = buildRouteStops(orderedDay);
  assert(
    checks,
    "Route dedupes consecutive identical buildings",
    orderedStops.length === 2 &&
      orderedStops[0].classes.map((c) => c.id).join(",") === "early,mid-same" &&
      orderedStops[1].classes[0].id === "late",
    `stops=${orderedStops.length} first=${orderedStops[0]?.classes.map((c) => c.id).join(",")}`,
  );

  // --- Live multi-building Tuesday route preserves time order ---
  const liveTue = classesForWeekday(schedule, 2);
  const { stops: liveStops } = buildRouteStops(liveTue);
  const times = liveStops.map((s) => s.classes[0].meetingTimeStartMs ?? 0);
  const sortedTimes = [...times].sort((a, b) => a - b);
  assert(
    checks,
    "Live Tuesday route stops are in ascending start-time order",
    times.length > 0 && times.every((t, i) => t === sortedTimes[i]),
    times.join(" → "),
  );
  assert(
    checks,
    "Live Tuesday route has at least one real campus pin",
    liveStops.length >= 1 &&
      liveStops.every(
        (s) =>
          s.latitude > 43.05 &&
          s.latitude < 43.1 &&
          s.longitude < -89.35 &&
          s.longitude > -89.45,
      ),
    `${liveStops.length} stops`,
  );

  // --- Legacy AsyncStorage migration: re-parse meetingDays ---
  const legacy = migrateScheduleClass({
    id: "legacy-tr",
    courseId: "011598",
    subjectCode: "600",
    name: "MATH 112",
    startTime: "9:55 AM",
    location: "Van Vleck Hall B107",
    duration: "75 min",
    professor: "TBD",
    meetingDays: "TR",
  });
  assert(
    checks,
    "Legacy entry without meetingWeekdays heals from meetingDays",
    JSON.stringify(legacy.meetingWeekdays) === JSON.stringify([2, 4]),
    JSON.stringify(legacy.meetingWeekdays),
  );
  assert(
    checks,
    "parseMeetingWeekdays('TR') === [2,4]",
    JSON.stringify(parseMeetingWeekdays("TR")) === JSON.stringify([2, 4]),
  );

  // --- Route ignores All-mode list: day filter is the source of stops ---
  const allModeList = [...schedule].sort(compareByNameThenTime);
  const routeFromDay = buildRouteStops(classesForWeekday(schedule, 2)).stops;
  const routeIfWronglyAll = buildRouteStops(allModeList).stops;
  assert(
    checks,
    "All-mode list differs from Tuesday day list (Route must use day)",
    allModeList.length !== classesForWeekday(schedule, 2).length ||
      allModeList.some((c) => !classMeetsOnWeekday(c, 2)),
  );
  assert(
    checks,
    "Route from day filter is not the same as routing the full All list",
    JSON.stringify(routeFromDay.map((s) => s.key)) !==
      JSON.stringify(routeIfWronglyAll.map((s) => s.key)) ||
      routeFromDay.length !== routeIfWronglyAll.length,
    `dayStops=${routeFromDay.length} allStops=${routeIfWronglyAll.length}`,
  );

  console.log("\nResults:");
  let failed = 0;
  for (const check of checks) {
    const mark = check.ok ? "PASS" : "FAIL";
    if (!check.ok) {
      failed += 1;
    }
    console.log(
      `  [${mark}] ${check.name}${check.detail ? ` — ${check.detail}` : ""}`,
    );
  }
  console.log(`\n${checks.length - failed}/${checks.length} passed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
