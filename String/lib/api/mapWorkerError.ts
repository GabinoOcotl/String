import { WorkerApiError } from "@/lib/api/workerClient";

export function mapWorkerError(error: unknown): string {
  if (error instanceof WorkerApiError) {
    if (error.status === 401) {
      return "Your session expired. Sign in again.";
    }
    if (error.status === 502 || error.status === 503) {
      return "Course data is temporarily unavailable. Try again later.";
    }
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}
