import { workerFetch } from "@/lib/api/workerClient";

export type WalkingLatLng = {
  latitude: number;
  longitude: number;
};

export type WalkingRouteResponse = {
  coordinates: WalkingLatLng[];
  source: "walking" | "straight";
  cached: boolean;
  distanceMeters?: number;
  durationSeconds?: number;
};

export async function fetchWalkingRoute(
  stops: WalkingLatLng[],
  accessToken: string,
): Promise<WalkingRouteResponse> {
  return workerFetch<WalkingRouteResponse>("/routes/walking", {
    accessToken,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stops }),
  });
}
