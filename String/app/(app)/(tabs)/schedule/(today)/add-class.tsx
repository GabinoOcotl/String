import { useState } from "react";

import { AddClassSearchStep } from "@/components/schedule/AddClassSearchStep";
import { AddClassSectionsStep } from "@/components/schedule/AddClassSectionsStep";
import type { CourseSearchHit } from "@/lib/api/types/enrollment";
import type { CourseSearchSnapshot } from "@/lib/schedule/useCourseSearch";

type AddClassStep = "search" | "sections";

/**
 * Add-class modal orchestrator.
 *
 * This screen only coordinates the two-step wizard:
 *   1. Search — AddClassSearchStep (owns search logic)
 *   2. Sections — AddClassSectionsStep (owns fetch + add logic)
 *
 * Cross-step state kept here: current step, selected course, and a search
 * snapshot so "Back to search" restores the previous query and results.
 *
 * See String/lib/schedule/add-class-flow.md for the full layout.
 */
export default function AddClassScreen() {
  const [step, setStep] = useState<AddClassStep>("search");
  const [selectedHit, setSelectedHit] = useState<CourseSearchHit | null>(null);
  const [searchSnapshot, setSearchSnapshot] = useState<CourseSearchSnapshot | null>(
    null,
  );

  if (step === "search") {
    return (
      <AddClassSearchStep
        initialQuery={searchSnapshot?.query}
        initialResults={searchSnapshot?.results}
        onSelectCourse={(hit, snapshot) => {
          setSearchSnapshot(snapshot);
          setSelectedHit(hit);
          setStep("sections");
        }}
      />
    );
  }

  if (!selectedHit) {
    return null;
  }

  return (
    <AddClassSectionsStep
      course={selectedHit}
      onBack={() => {
        setSelectedHit(null);
        setStep("search");
      }}
    />
  );
}
