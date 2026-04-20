---
title: Types
summary: TypeScript type conventions — string literal unions over enums, no `any` without rationale, discriminated unions over flags.
groups: [typescript]
tags: [typescript, typescript/types]
---

# Types

- **Status**: Accepted

## TL;DR (hard rules)

- **NEVER** use `enum` — use string literal unions instead.
- **NEVER** use `any` without a documented rationale in a code comment. Prefer `unknown` and narrow.
- **PREFER** discriminated unions over boolean flags or class inheritance when representing variant behavior.
- **PREFER** `type` aliases over `interface` unless declaration merging is genuinely required (almost never).

## Why no `enum`

TypeScript `enum` emits runtime code, has awkward reverse-mapping for numeric enums, and doesn't compose with JSON/API serialization. String literal unions are pure compile-time, serialize naturally, and narrow in `switch` without fuss.

**Bad:**

```ts
enum Status {
  Pending = 'pending',
  Complete = 'complete',
  Failed = 'failed',
}

const s: Status = Status.Pending
```

**Good:**

```ts
export type Status = 'pending' | 'complete' | 'failed'

const s: Status = 'pending'
```

Serialization, API contracts, and narrowing all Just Work.

## Why no `any`

`any` turns off the type system for that value. The bug you would have caught at compile time now shows up at runtime, usually far from its origin. When you truly can't know the shape, use `unknown` and narrow explicitly.

**Bad:**

```ts
const parse = (input: any) => {
  return input.data.items.map((x: any) => x.id)
}
```

**Good:**

```ts
const parse = (input: unknown): string[] => {
  if (!input || typeof input !== 'object') return []
  const data = (input as { data?: { items?: unknown[] } }).data
  if (!Array.isArray(data?.items)) return []
  return data.items.filter((x): x is { id: string } =>
    typeof x === 'object' && x !== null && typeof (x as { id?: unknown }).id === 'string'
  ).map((x) => x.id)
}
```

If you genuinely need `any` (e.g., interop with a library that isn't typed), write a comment explaining why:

```ts
// The foo SDK returns untyped results; we validate at the boundary in validateFooResponse().
const raw: any = sdk.call()
```

## Discriminated unions over flags

**Bad (boolean flags that don't enforce which combinations are valid):**

```ts
type Event = {
  kind: string
  userId?: string
  errorCode?: string
  retryAfterMs?: number
}
```

**Good (discriminated union — each variant carries exactly the fields it needs):**

```ts
type Event =
  | { kind: 'user_created'; userId: string }
  | { kind: 'error'; errorCode: string }
  | { kind: 'retry_scheduled'; retryAfterMs: number }

const handle = (event: Event) => {
  switch (event.kind) {
    case 'user_created':
      return welcome(event.userId)       // userId is guaranteed present
    case 'error':
      return reportError(event.errorCode)
    case 'retry_scheduled':
      return scheduleRetry(event.retryAfterMs)
  }
}
```

The compiler verifies all cases are handled and each branch has only the fields its variant actually carries.

## `type` vs `interface`

Use `type` by default. Only reach for `interface` when you genuinely need declaration merging (mostly: augmenting third-party library types).

```ts
// Good — consistent default
export type User = {
  id: string
  email: string
}

// Reserved for the rare merging case
// interface Window {
//   __MY_APP__: AppState
// }
```

## How to verify

- Grep for `\\benum\\b` in source — should be empty.
- Grep for `: any` and `as any` — each occurrence should have a nearby comment explaining why.
- Configure lint rules: `@typescript-eslint/no-explicit-any` (with override comments documented), `@typescript-eslint/prefer-literal-enum-member`, or a ban on `enum` entirely.
