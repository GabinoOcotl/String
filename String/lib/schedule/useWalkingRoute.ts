import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  fetchWalkingRoute,
  type WalkingLatLng,
  type WalkingRouteResponse,
} from "@/lib/api/routes";
import type { RouteStop } from "@/lib/schedule/routeStops";

function stopsFingerprint(stops: RouteStop[]): string {
  return stops.map((s) => `${s.latitude},${s.longitude}`).join("|");
}

function straightFromStops(stops: RouteStop[]): WalkingLatLng[] {
  return stops.map((s) => ({
    latitude: s.latitude,
    longitude: s.longitude,
  }));
}

/**
 * Loads an OpenRouteService walking polyline via the Worker for the day's
 * map stops. Falls back to a straight line while loading or on error.
 */
export function useWalkingRoute(stops: RouteStop[]): {
  coordinates: WalkingLatLng[];
  source: WalkingRouteResponse["source"] | "loading";
  distanceMeters?: number;
  durationSeconds?: number;
} {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const fingerprint = useMemo(() => stopsFingerprint(stops), [stops]);
  const requestStops = useMemo(
    () =>
      stops.map((s) => ({
        latitude: s.latitude,
        longitude: s.longitude,
      })),
    [stops],
  );
  const straight = useMemo(() => straightFromStops(stops), [stops]);

  const [result, setResult] = useState<{
    fingerprint: string;
    response: WalkingRouteResponse | null;
    loading: boolean;
  }>({ fingerprint, response: null, loading: false });

  useEffect(() => {
    if (requestStops.length < 2 || !accessToken) {
      setResult({ fingerprint, response: null, loading: false });
      return;
    }

    let cancelled = false;
    setResult({ fingerprint, response: null, loading: true });

    void (async () => {
      try {
        const response = await fetchWalkingRoute(requestStops, accessToken);
        if (!cancelled) {
          setResult({ fingerprint, response, loading: false });
        }
      } catch {
        if (!cancelled) {
          setResult({
            fingerprint,
            response: {
              coordinates: requestStops,
              source: "straight",
              cached: false,
            },
            loading: false,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, fingerprint, requestStops]);

  if (requestStops.length < 2) {
    return { coordinates: straight, source: "straight" };
  }

  if (result.fingerprint !== fingerprint || result.loading || !result.response) {
    return { coordinates: straight, source: "loading" };
  }

  return {
    coordinates: result.response.coordinates,
    source: result.response.source,
    distanceMeters: result.response.distanceMeters,
    durationSeconds: result.response.durationSeconds,
  };
}
