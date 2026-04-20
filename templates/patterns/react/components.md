---
title: Components
summary: PascalCase files, named exports, explicit Props type, semantic HTML, loading/error states on every data-fetching view.
groups: [react]
tags: [react, react/components]
---

# Components

- **Status**: Accepted

## TL;DR (hard rules)

- **MUST** use PascalCase for component names and files: `AgentCard.tsx`, not `agent-card.tsx`.
- **MUST** use named exports for components, not default exports.
- **MUST** type props as an explicit `type Props = { ... }` alias above the component.
- **MUST** use semantic HTML elements (`<button>`, `<nav>`, `<section>`, `<header>`, `<main>`, `<article>`, `<aside>`, `<ul>`, `<li>`) rather than `<div>` soup.
- **MUST** give every data-fetching component a loading state and an error state (see [../frontend/loading-states.md](../frontend/loading-states.md), [../frontend/error-handling.md](../frontend/error-handling.md)).
- **PREFER** function components with hooks over class components.
- **PREFER** composition (children, render props, slot components) over boolean prop explosions.

## File + export shape

```tsx
// AgentCard.tsx
import { Skeleton } from '../ds/skeleton'

type Props = {
  agent: Agent
  onSelect?: (id: string) => void
}

export const AgentCard = ({ agent, onSelect }: Props) => {
  return (
    <article className="agent-card">
      <header>
        <h3>{agent.name}</h3>
      </header>
      <button onClick={() => onSelect?.(agent.id)}>Open</button>
    </article>
  )
}
```

Why named exports: autocomplete works reliably, rename operations update all import sites, IDEs surface the real name everywhere. Default exports encourage inconsistent aliasing at import sites.

## Semantic HTML

Screen readers, keyboard users, and browser heuristics all rely on the right element. A `<button>` is focusable, activates with space/enter, has a role. A `<div onClick>` doesn't — you'd need to add `role`, `tabIndex`, `onKeyDown`, all manually.

**Bad:**

```tsx
<div onClick={handleClick} className="btn">Save</div>
```

**Good:**

```tsx
<button type="button" onClick={handleClick}>Save</button>
```

Use the right element for the job:

- `<button>` for in-page actions. `<a>` for navigation (including SPA links).
- `<nav>` for primary/secondary navigation blocks.
- `<main>` for the primary content area of a page (exactly one per page).
- `<section>` / `<article>` for meaningful content groupings.
- `<ul>` / `<li>` for lists (including lists of cards). Screen readers announce "list with 12 items."
- `<form>` with `<label>` associated to inputs for any form.

## Composition over boolean explosions

When a component grows five boolean props — `showHeader`, `showFooter`, `dense`, `bordered`, `withAvatar` — split it into composable parts.

**Bad:**

```tsx
<Card
  showHeader
  showFooter
  dense
  bordered
  withAvatar
  headerTitle="Agent"
  headerSubtitle="Running"
  footerAction={<Button>View</Button>}
/>
```

**Good:**

```tsx
<Card dense bordered>
  <Card.Header>
    <Avatar src={agent.avatar} />
    <div>
      <h3>{agent.name}</h3>
      <p>Running</p>
    </div>
  </Card.Header>
  <Card.Body>...</Card.Body>
  <Card.Footer>
    <button>View</button>
  </Card.Footer>
</Card>
```

The API stays simple, the parts are independently usable, and future additions don't grow the prop list.

## Data-fetching components

Every component that reads server state has three render branches — loading, error, data. See [../frontend/loading-states.md](../frontend/loading-states.md) and [../frontend/error-handling.md](../frontend/error-handling.md) for the full rules.

```tsx
export const AgentList = () => {
  const { data, isLoading, error } = useAgents()

  if (isLoading) return <AgentListSkeleton />
  if (error) return <AgentListError error={error} />
  if (data.length === 0) return <AgentListEmpty />

  return (
    <ul>
      {data.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
    </ul>
  )
}
```

## Anti-patterns

**Default exports:**

```tsx
// Bad — import site picks the name; rename breaks nothing visibly
export default function AgentCard(props) { ... }

// Import:
import Card from './AgentCard'  // loses semantic connection
```

**Untyped props / `any` props:**

```tsx
// Bad
export const AgentCard = (props: any) => { ... }

// Good
type Props = { agent: Agent; onSelect?: (id: string) => void }
export const AgentCard = ({ agent, onSelect }: Props) => { ... }
```

**Div soup:**

```tsx
// Bad
<div className="page">
  <div className="header">
    <div className="title">Agents</div>
  </div>
  <div className="nav">...</div>
  <div className="list">
    <div className="card">...</div>
  </div>
</div>

// Good
<main>
  <header>
    <h1>Agents</h1>
  </header>
  <nav>...</nav>
  <ul>
    <li><article className="card">...</article></li>
  </ul>
</main>
```

## How to verify

- Grep for `export default function` and `export default class` in components — each should be converted to a named export.
- Grep for `<div onClick` — each is a potential semantic HTML miss.
- Run an accessibility linter (eslint-plugin-jsx-a11y) to catch semantic/accessibility issues at build time.
