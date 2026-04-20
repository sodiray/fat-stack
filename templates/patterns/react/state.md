---
title: State
summary: Local UI state in useState, shared state in a store, server state in a query library. Unidirectional flow, narrow selectors.
groups: [react]
tags: [react, react/state]
---

# State

- **Status**: Accepted

## TL;DR (hard rules)

- **MUST** keep local UI state (open/closed, hover, focus, draft input) in `useState` or `useReducer`.
- **MUST** keep shared, app-wide state (current user, active workspace, navigation) in a store (Zustand, Redux, Jotai, or equivalent).
- **MUST** keep server data in a server-state library (TanStack Query, SWR, tRPC) — not hand-rolled in a client store.
- **MUST** read from stores via selectors that return the **narrowest slice** needed — never the whole store.
- **MUST** flow state updates one direction: event → action → store → components.
- **NEVER** mutate store state directly — go through actions.
- **PREFER** lifting state to the nearest common parent before reaching for a store.

## Three kinds of state

| Kind | Lives in | Examples |
|---|---|---|
| Local UI | `useState` / `useReducer` | modal open, form draft, hover state, active tab |
| Shared client | Store (Zustand/Redux/Jotai) | current user, theme, active workspace |
| Server | Query library (TanStack Query, SWR, tRPC) | agent list, workspace settings, anything from the API |

The biggest mistake is putting server data in a client store "because we have one." Client stores have no refetch, staleness, cache invalidation, or request deduplication. Query libraries do all of that, well. Use them.

## Why narrow selectors

A selector is a function that pulls a slice out of the store. Narrow selectors mean fewer re-renders when unrelated state changes.

**Bad:**

```ts
const store = useStore()               // subscribes to every change
return <div>{store.user.name}</div>
```

**Good:**

```ts
const userName = useStore((s) => s.user.name) // subscribes only to name changes
return <div>{userName}</div>
```

In a big app, broad selectors are the most common cause of re-render storms. Select exactly what the component needs.

## Unidirectional flow

```
user event → action (in store) → store state update → components re-render
```

Components never mutate state directly. They call actions. Actions update state. Components read state.

```ts
// Store
export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}))

// Component
const Theme = () => {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  )
}
```

The rule to enforce: every state mutation is named (an action), not anonymous (an inline setter). This makes mutations greppable and reviewable.

## Lift first, globalize last

Before reaching for a store, ask: "is this shared across the whole app, or just between a few components?" If the latter, lift it to their common parent.

**Wrong reflex:**

```ts
// "Two components need this — put it in the store"
useAppStore.setState({ selectedItemId: id })
```

**Better:**

```tsx
// Keep it local to the parent that owns both children
const Page = () => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  return (
    <>
      <List onSelect={setSelectedItemId} />
      <Detail itemId={selectedItemId} />
    </>
  )
}
```

Only move to a store when:
- The state is read by genuinely distant components (no common parent worth prop-drilling through).
- The state outlives any one component tree (navigation, auth, theme).
- Persistence/derived state across routes is needed.

## Never mix server and client state

**Bad:**

```ts
// Pulling server data into the client store
const fetchAgents = async () => {
  const agents = await api.agents.list()
  useStore.setState({ agents })
}
```

Problems: no refetch, no staleness, manual invalidation, stale-when-refocus doesn't work, multiple components triggering duplicate fetches.

**Good:**

```ts
// Let the query library handle caching, refetch, and staleness
export const useAgents = () => useQuery({
  queryKey: ['agents'],
  queryFn: () => api.agents.list(),
})
```

The client store holds things that **aren't** server data: current selection, UI preferences, auth token. Server data stays in the query cache.

## Anti-patterns

**Broad selectors.** `useStore()` without a selector function returns the whole store. Almost every component should have a selector.

**Setting inside effects for no reason.**

```ts
// Bad — `count` comes from the store, `doubled` is just derived
useEffect(() => {
  setDoubled(count * 2)
}, [count])

// Good — derive inline
const doubled = count * 2
```

**Actions that touch unrelated slices.** An action named `setTheme` should update the theme, not also toggle the sidebar. Keep actions narrow.

## How to verify

- Grep for `useStore()` without arguments — each should probably be a selector.
- Grep for `.setState(` outside the store module — all mutations should go through actions.
- Check for server data in the client store — if it's an array of domain objects fetched from the API, it belongs in a query.
