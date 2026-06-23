# Add-class flow

Two-step modal for searching the UW catalog and adding a section to the local schedule.

## Layout

```
add-class.tsx          Orchestrator — step, selected course, search snapshot
├── AddClassSearchStep     Search UI + useCourseSearch
└── AddClassSectionsStep   Sections UI + useCourseSections
```

Shared presentation pieces live under `components/schedule/` (`CourseSearchBar`, `CourseSearchResult`, `SectionPickerRow`, `ScheduleErrorBanner`, `ScheduleLoadingCenter`).

## Responsibilities

| Module | Role |
|--------|------|
| `app/.../add-class.tsx` | Wizard coordinator only. Does not call APIs. |
| `useCourseSearch` | Debounced `GET /classes`, exposes query/results/loading/error. |
| `useCourseSections` | `GET /classes/:subject/:id/sections`, add to schedule, close modal. |
| `AddClassSearchStep` | Renders search step; passes a **snapshot** up on course pick. |
| `AddClassSectionsStep` | Renders sections step; fetches when `course` is set. |

## Why the orchestrator keeps a search snapshot

Steps unmount when switching. Search state lives inside `AddClassSearchStep`, so on course pick the step passes `{ query, results }` to the parent. When the user taps "Back to search", the orchestrator passes that snapshot back as `initialQuery` / `initialResults`. `useCourseSearch` reuses cached results until the user edits the query again.

## Entry point

Navigate with `router.push("/schedule/(today)/add-class")` (header **+** button on the Today screen).
