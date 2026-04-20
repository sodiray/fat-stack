---
title: Loading States
summary: Every data-fetching surface shows a shape-matched loading state. Spinners are a break-glass; empty-state flashes are bugs.
groups: [frontend]
tags: [frontend, frontend/loading]
---

# Loading States

- **Status**: Accepted

## TL;DR (hard rules)

- **MUST** show a loading state whenever data is being fetched for a view that renders domain data.
- **MUST** match the loading state's shape to the rendered content — same number of rows, same card slots, same header/body/avatar proportions.
- **NEVER** use a generic centered spinner as the primary loading state for a page or list view.
- **NEVER** render "flash of empty state" (an empty list or "No results" placeholder while data is still loading) — that's a bug, not a loading state.
- **PREFER** server-side prefetch so no loading state is needed at all.

## Why shape-matched skeletons

A loading state exists to tell the user **"content is coming here, and here's roughly how much."** A centered spinner fails at both jobs:

1. It doesn't communicate where content will appear.
2. It creates a jarring layout shift when content lands and the spinner is replaced by rendered rows.

A shape-matched skeleton:

- Eliminates layout shift — the boxes are the same size and position as the real rendered content.
- Sets the reader's expectation for how much is loading (three items vs thirty).
- Feels fast even when latency is the same, because the page "fills in" instead of "jumps in."

## Three states, every data view

For any view that reads domain data, there are three visual states:

1. **Loading** — no data yet. Show the shape-matched skeleton.
2. **Error** — fetch failed. Show the error state (see [error-handling.md](./error-handling.md)).
3. **Data** — either rendered rows OR an intentional empty state ("No agents yet — create one").

The empty state is only shown when the request has **succeeded** and returned no rows. Never before.

## What a skeleton should mirror

- **Number of items**: if the list will usually show 5–10 rows, show 5–10 skeleton rows. Not 3, not 20.
- **Row height**: match the actual row height so the page doesn't jump when data lands.
- **Structural elements**: if a row has an avatar, title line, and subtitle, the skeleton has a circle, a long line, and a short line.
- **Headers and surrounding chrome**: if the page has a title/search bar above the list, those should remain fully rendered — only the data portion is a skeleton.

## Example

```tsx
const AgentList = () => {
  const { data, isLoading, error } = useAgents()

  if (isLoading) return <AgentListSkeleton />
  if (error) return <AgentListError error={error} />
  if (data.length === 0) return <AgentListEmpty />
  return (
    <ul>
      {data.map((agent) => <AgentRow key={agent.id} agent={agent} />)}
    </ul>
  )
}

const AgentListSkeleton = () => (
  <ul>
    {Array.from({ length: 6 }).map((_, i) => (
      <li key={i} className="row">
        <SkeletonAvatar size="md" />
        <div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32 mt-2" />
        </div>
      </li>
    ))}
  </ul>
)
```

Each row's skeleton mirrors the real row: avatar, title, subtitle.

## Anti-patterns

**Flash of empty state.** The moment the component mounts, `data` is `undefined` or `[]`, so the code renders `"No results"` briefly before loading finishes. Always gate empty state on "fetched AND truly empty."

```tsx
// Bad — shows "No results" for the brief moment before fetch completes
if (!data || data.length === 0) return <Empty />

// Good — separate states
if (isLoading) return <Skeleton />
if (data.length === 0) return <Empty />
```

**Spinner in the middle of the content area.** A `<Spinner />` centered where the list will be is the worst of both worlds: it hides the shape and creates layout shift.

**Skeleton everywhere including the header.** If the page title and nav don't change while loading, don't skeletonize them. Only skeletonize what's actually loading.

## How to verify

- On slow network (throttle to "Slow 3G"), navigate to any data-loaded view. You should see structured boxes that resemble the real content, not a spinner.
- Check for layout shift: when data lands, the content should appear in place, not push other elements around.
- Grep for `<Spinner` or `loading-spinner` in view components — each occurrence should be a secondary/inline spinner, not a full-view primary loader.
