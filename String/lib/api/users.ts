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

export type ProfileClass = {
  id: string;
  course_designation: string | null;
  subject_code: string | null;
  course_id: string | null;
  enrollment_class_number: number | null;
};

export type PublicUserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  email: string;
  description: string | null;
  classes: ProfileClass[];
  shared_classes: ProfileClass[];
  is_self: boolean;
  has_avatar: boolean;
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

/** Co-member gated profile (self always allowed). */
export function getUserPublicProfile(
  userId: string,
  accessToken: string,
): Promise<PublicUserProfile> {
  return workerFetch<PublicUserProfile>(
    `/users/${encodeURIComponent(userId)}/profile`,
    { accessToken, method: "GET" },
  );
}

/** True when D1 has at least a first or last name. */
export function profileHasDisplayName(profile: UserProfile): boolean {
  const first = profile.first_name?.trim() ?? "";
  const last = profile.last_name?.trim() ?? "";
  return first.length > 0 || last.length > 0;
}

export function classDisplayName(item: ProfileClass): string {
  return (
    item.course_designation?.trim() ||
    [item.subject_code, item.course_id].filter(Boolean).join(" ") ||
    item.id
  );
}
