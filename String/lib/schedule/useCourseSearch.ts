import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { searchCourses } from "@/lib/api/classes";
import { mapWorkerError } from "@/lib/api/mapWorkerError";
import type { CourseSearchHit } from "@/lib/api/types/enrollment";
import { workerConfigError } from "@/lib/api/workerClient";

const PAGE_SIZE = 20;
const EMPTY_RESULTS: CourseSearchHit[] = [];

/** Snapshot passed to the orchestrator so search state survives step changes. */
export type CourseSearchSnapshot = {
  query: string;
  results: CourseSearchHit[];
};

export type UseCourseSearchOptions = {
  initialQuery?: string;
  initialResults?: CourseSearchHit[];
};

/**
 * Debounced course catalog search for the add-class flow.
 * Used by AddClassSearchStep; state can be restored via initialQuery/initialResults.
 */
export function useCourseSearch({
  initialQuery = "",
  initialResults = EMPTY_RESULTS,
}: UseCourseSearchOptions = {}) {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<CourseSearchHit[]>(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryEditedRef = useRef(false);

  useEffect(() => {
    if (!query) {
      setResults((prev) => (prev.length === 0 ? prev : EMPTY_RESULTS));
      setError((prev) => (prev === null ? prev : null));
      setLoading((prev) => (prev === false ? prev : false));
      return;
    }

    // Restored snapshot from "Back to search" — keep cached results until the user edits.
    if (
      !queryEditedRef.current &&
      query === initialQuery &&
      initialResults.length > 0
    ) {
      return;
    }

    if (!accessToken) {
      setError("Sign in to search courses.");
      setResults([]);
      return;
    }

    if (workerConfigError) {
      setError(workerConfigError);
      setResults([]);
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchCourses(query, 1, PAGE_SIZE, accessToken);
        if (!cancelled) {
          setResults(response.hits);
        }
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(mapWorkerError(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [query, accessToken, initialQuery, initialResults]);

  const onQueryChange = useCallback((nextQuery: string) => {
    queryEditedRef.current = true;
    setQuery(nextQuery);
  }, []);

  const getSnapshot = useCallback(
    (): CourseSearchSnapshot => ({ query, results }),
    [query, results],
  );

  return {
    query,
    results,
    loading,
    error,
    onQueryChange,
    getSnapshot,
  };
}
