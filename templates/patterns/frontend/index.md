---
title: Frontend — Review Checklist
summary: Compiled checklist of framework-agnostic UI rules (loading states, error handling).
groups: [frontend]
tags: [frontend]
---

# Frontend — Review Checklist

> Compiled checklist for the `frontend/` group. These rules apply to any UI — React, Vue, Svelte, vanilla, mobile. For React-specific patterns, see the `react/` group if present.

## Loading states

- MUST show a loading state whenever data is fetched for a view. [loading-states.md]
- MUST match the loading state's shape to the rendered content (skeleton mirrors the real layout). [loading-states.md]
- NEVER show a generic centered spinner as the primary loading state for a page or list view. [loading-states.md]
- NEVER render an empty state ("No results") while data is still loading — that's a bug, not a loading state. [loading-states.md]
- PREFER server-side prefetch so no loading state is needed at all. [loading-states.md]

## Error handling

- MUST classify errors on the user-facing surface: transient (retry), expected (inline message), fatal (error boundary). [error-handling.md]
- MUST show user-facing errors in the user's language — no stack traces, no "Error: EPIPE" leaking to the UI. [error-handling.md]
- MUST log full error context to observability with enough detail to reproduce. [error-handling.md]
- MUST wrap significant UI trees in an error boundary so a single component failure doesn't blank the whole app. [error-handling.md]
- NEVER swallow errors silently. If a failure isn't shown and isn't logged, it didn't happen. [error-handling.md]
