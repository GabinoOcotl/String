import { workerFetch } from "@/lib/api/workerClient";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  description: string | null;
};

export type UpdateMyProfilePayload = {
  first_name?: string;
  last_name?: string;
  description?: string | null;
};

export function getMyProfile(accessToken: string): Promise<UserProfile> {
  return workerFetch<UserProfile>("/users/me", {
    accessToken,
    method: "GET",
  });
}

export function updateMyProfile(
  accessToken: string,
  payload: UpdateMyProfilePayload,
): Promise<UserProfile> {
  return workerFetch<UserProfile>("/users/me", {
    accessToken,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** True when D1 has at least a first or last name. */
export function profileHasDisplayName(profile: UserProfile): boolean {
  const first = profile.first_name?.trim() ?? "";
  const last = profile.last_name?.trim() ?? "";
  return first.length > 0 || last.length > 0;
}
