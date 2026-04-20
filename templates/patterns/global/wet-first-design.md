---
title: WET-First Design
summary: Prefer duplicated inline code over premature abstraction. Extract only when drift between copies would break the platform.
groups: [global]
tags: [global, abstraction]
---

# WET-First Design

- **Status**: Accepted

## TL;DR (hard rules)

- **MUST** default to inline, duplicated code at call sites (endpoints, handlers, jobs, scripts) when the same logic appears a small number of times.
- **MUST NOT** extract logic "because it looks reusable" or to satisfy DRY instincts alone.
- **MUST** extract when drift between copies would break the platform — canonical cases: identifier formats, serialization contracts, protocol versions, authorization checks.
- **SHOULD** follow the *rule of three*: once the same logic appears in three real places AND drift would cause a real bug, extract it.
- **SHOULD** extract as a **pure function** first — no database, no network, no time, no randomness, no hidden state. Move to a stateful owner only when the logic is genuinely non-pure AND a real domain concept owns it.
- **NEVER** create "utility" or "helpers" modules as dumping grounds for unrelated cross-cutting logic.

## Why

The default industry instinct is DRY: extract early, centralize aggressively, build abstraction layers that promise reuse. For most application logic, this costs more than it saves.

- **Inline code is cheap to read, modify, and delete.** The next engineer (or agent) sees the full behavior in one place — inputs, outputs, permissions, logs, error handling — together.
- **Abstractions create coupling.** Two call sites that share a helper are now coupled through it. A change in one forces a decision about the other. Removing a duplicate is local; removing a shared dependency is distributed.
- **Duplication is trivially fixable with modern tooling.** Search-and-replace, structural refactors, and AI-assisted edits handle mechanical duplication well. They don't handle wrong abstractions well.
- **The wrong abstraction is worse than duplication.** It hides the actual shape of the behavior and invites more code to hang off it until the "helper" becomes impossible to reason about.

Extract only when duplication creates **real platform risk** — not stylistic discomfort.

## The preference order

### 1) Best: inline, duplicated code

Keep query, branching, response shaping, and orchestration in the call site. The logic reads top-to-bottom; there's no indirection.

**Good (inline, explicit, local):**

```ts
export const listWidgets = async (request) => {
  const workspaceId = request.auth.workspaceId

  const widgets = await db.widget.findMany({
    where: { workspaceId, archivedAt: null },
    orderBy: [{ updatedAt: 'desc' }],
  })

  return widgets.map((w) => ({ id: w.id, name: w.name, enabled: w.enabled }))
}
```

**Bad (premature extraction — hides the query behind a helper and invites dumping-ground growth):**

```ts
export const listWidgets = async (request) => {
  return widgetUtils.listForWorkspace(request.auth.workspaceId)
}
```

### 2) When drift would break things: extract as a pure function

If the same logic is reused across many call sites AND inconsistency between copies would break the system (identifier format, serialization shape, protocol version), extract it as a pure function.

```ts
// shared/identifiers.ts
export const widgetKey = (workspaceId: string, name: string): string =>
  `${workspaceId}:${name}`
```

*Pure* means: no database, no network, no time, no random, no environment reads, no hidden state. Same input → same output, always.

### 3) Last resort: a domain owner for non-pure logic

Only when the logic is genuinely stateful (queries a database, coordinates multiple systems) AND there's a real domain concept that owns it — a concept with a model, a table, or a clearly scoped identity. Not a generic "helpers" bucket.

## Anti-patterns

**"utils/" or "helpers/" modules.** They accumulate unrelated logic because the bar to add is "it sort of fits." Don't create them.

**Extracting because "we might reuse this later."** You might. You also might not — and when you do, the reuse often looks different enough that the abstraction was wrong.

**Abstracting for consistency alone.** "All our endpoints should go through the service layer" sounds clean but creates coupling. Prefer: each call site tells its own story, consistent by convention, not by shared code.

## How to verify

When reviewing code:

1. For any new `utils/` or `helpers/` file: Is the logic pure? Has drift here caused real bugs? If not, inline it back.
2. For any new manager or service: Is there a real domain concept with a model or owner? If not, it's a dumping ground — push the logic back to call sites.
3. For any abstracted function with three or fewer call sites: Would deleting the abstraction and inlining cost more than maintaining the coupling? If not, inline.
