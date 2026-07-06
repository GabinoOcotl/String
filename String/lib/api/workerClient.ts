const workerUrl = process.env.EXPO_PUBLIC_WORKER_URL;

export const workerConfigError = !workerUrl
  ? "App is misconfigured. Missing Worker environment variables."
  : null;

export class WorkerApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "WorkerApiError";
    this.status = status;
  }
}

type WorkerFetchOptions = Omit<RequestInit, "headers"> & {
  accessToken: string;
  headers?: Record<string, string>;
};

function buildWorkerUrl(path: string): string {
  const base = workerUrl!.replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  } catch {
    // Response body is not JSON.
  }

  return `Request failed (${response.status})`;
}

export async function workerFetch<T>(
  path: string,
  { accessToken, headers, ...init }: WorkerFetchOptions,
): Promise<T> {
  if (workerConfigError) {
    throw new WorkerApiError(workerConfigError, 0);
  }

  const response = await fetch(buildWorkerUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
  });

  if (!response.ok) {
    throw new WorkerApiError(await parseErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}

/** Like workerFetch but for endpoints that return 204 No Content. */
export async function workerFetchNoContent(
  path: string,
  { accessToken, headers, ...init }: WorkerFetchOptions,
): Promise<void> {
  if (workerConfigError) {
    throw new WorkerApiError(workerConfigError, 0);
  }

  const response = await fetch(buildWorkerUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
  });

  if (!response.ok) {
    throw new WorkerApiError(await parseErrorMessage(response), response.status);
  }
}
