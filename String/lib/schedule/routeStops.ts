import type { ScheduleClass } from "@/lib/schedule/types";

/** UW–Madison campus center — fallback when there are no mappable stops. */
export const UW_CAMPUS_REGION = {
  latitude: 43.0766,
  longitude: -89.4125,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
} as const;

export type RouteStop = {
  key: string;
  latitude: number;
  longitude: number;
  buildingLabel: string;
  /** One or more classes at this building in time order (consecutive dupes merged). */
  classes: ScheduleClass[];
};

export function hasValidCoords(klass: ScheduleClass): boolean {
  return (
    typeof klass.latitude === "number" &&
    typeof klass.longitude === "number" &&
    Number.isFinite(klass.latitude) &&
    Number.isFinite(klass.longitude)
  );
}

function sameBuilding(a: ScheduleClass, b: ScheduleClass): boolean {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

/**
 * Day’s classes → map stops: keep those with lat/lng, drop consecutive
 * identical buildings, report how many lacked coordinates.
 */
export function buildRouteStops(classes: ScheduleClass[]): {
  stops: RouteStop[];
  missingCoordCount: number;
} {
  let missingCoordCount = 0;
  const withCoords: ScheduleClass[] = [];

  for (const klass of classes) {
    if (hasValidCoords(klass)) {
      withCoords.push(klass);
    } else {
      missingCoordCount += 1;
    }
  }

  const stops: RouteStop[] = [];
  for (const klass of withCoords) {
    const last = stops[stops.length - 1];
    if (last && sameBuilding(last.classes[0], klass)) {
      last.classes.push(klass);
      continue;
    }

    const buildingLabel =
      klass.buildingName?.trim() ||
      klass.location?.trim() ||
      "Unknown location";

    stops.push({
      key: `${klass.latitude},${klass.longitude}-${stops.length}`,
      latitude: klass.latitude as number,
      longitude: klass.longitude as number,
      buildingLabel,
      classes: [klass],
    });
  }

  return { stops, missingCoordCount };
}

export function stopListLabel(stop: RouteStop, index: number): string {
  const names = stop.classes.map((c) => c.name).join(", ");
  const time = stop.classes[0]?.startTime?.trim() || "TBD";
  return `${index + 1}. ${names} · ${stop.buildingLabel} · ${time}`;
}

export function markerTitle(stop: RouteStop, index: number): string {
  const names = stop.classes.map((c) => c.name).join(", ");
  return `${index + 1}. ${names}`;
}

export function markerDescription(stop: RouteStop): string {
  const time = stop.classes[0]?.startTime?.trim() || "TBD";
  return `${stop.buildingLabel} · ${time}`;
}
