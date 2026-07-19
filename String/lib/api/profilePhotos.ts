import {
  buildWorkerUrl,
  workerFetchNoContent,
  workerFetchResponse,
} from "@/lib/api/workerClient";

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

export type ProfilePhotoUploadResult = {
  contentType: string;
  updatedAt: string;
};

export async function uploadProfilePhoto(
  accessToken: string,
  localUri: string,
): Promise<ProfilePhotoUploadResult> {
  const localResponse = await fetch(localUri);
  if (!localResponse.ok) {
    throw new Error("Could not read the selected photo.");
  }

  const blob = await localResponse.blob();
  if (blob.size > MAX_PROFILE_PHOTO_BYTES) {
    throw new Error("The compressed photo is larger than 5 MB. Choose another photo.");
  }

  const response = await workerFetchResponse("/users/me/photo", {
    accessToken,
    method: "PUT",
    body: blob,
    headers: {
      "Content-Type": "image/jpeg",
    },
  });

  return response.json() as Promise<ProfilePhotoUploadResult>;
}

export function deleteProfilePhoto(accessToken: string): Promise<void> {
  return workerFetchNoContent("/users/me/photo", {
    accessToken,
    method: "DELETE",
  });
}

export function profilePhotoSource(
  userId: string,
  accessToken: string,
  version: string,
) {
  return {
    uri: `${buildWorkerUrl(`/users/${encodeURIComponent(userId)}/photo`)}?v=${encodeURIComponent(version)}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}
