---
title: Code Style
summary: TypeScript coding conventions — const-only, arrow functions, guard clauses, no classes, no else ladders.
groups: [typescript]
tags: [typescript, typescript/code-style]
---

# Code Style

- **Status**: Accepted

## TL;DR (hard rules)

- **NEVER** use `let` — only `const`. If a value must change, derive it from a function that returns the new value.
- **NEVER** use `function` declarations for exported logic. Use arrow consts: `export const work = () => {}`, not `export function work() {}`.
- **NEVER** use classes for logic that doesn't interact with a framework/library that requires them. Use functions and objects.
- **MUST** put guard clauses at the top of a function and exit early.
- **MUST** keep the happy path unindented so the main logic reads top-to-bottom.

## Preferences

- **PREFER** arrow consts over function declarations, even for non-exported helpers.
- **PREFER** extracted helpers or a `switch` on a discriminated union over long `else if` chains.
- **PREFER** object literals with methods over classes when you just need grouped functions.

## Escape early — guard clauses

**Bad (nested):**

```ts
export const handle = async (input: Input) => {
  if (input.workspaceId) {
    if (input.userId) {
      return doWork(input)
    } else {
      throw new Error('Missing userId')
    }
  } else {
    throw new Error('Missing workspaceId')
  }
}
```

**Good (escape early):**

```ts
export const handle = async (input: Input) => {
  if (!input.workspaceId) throw new Error('Missing workspaceId')
  if (!input.userId) throw new Error('Missing userId')

  return doWork(input)
}
```

## `const` only

**Bad:**

```ts
let status = 'pending'
if (result.ok) {
  status = 'complete'
} else if (result.retryable) {
  status = 'retrying'
} else {
  status = 'failed'
}
```

**Good (derive via function):**

```ts
const statusFor = (result: Result): Status => {
  if (result.ok) return 'complete'
  if (result.retryable) return 'retrying'
  return 'failed'
}

const status = statusFor(result)
```

## Arrow consts over function declarations

**Bad:**

```ts
export function sendEmail(to: string, body: string) {
  // ...
}
```

**Good:**

```ts
export const sendEmail = (to: string, body: string) => {
  // ...
}
```

Rationale: consistent shape across exports, no hoisting surprises, easier to refactor.

## Functions over classes

**Bad (class for stateless logic):**

```ts
export class UserFormatter {
  format(user: User): string {
    return `${user.name} <${user.email}>`
  }
}
```

**Good (plain function):**

```ts
export const formatUser = (user: User): string => `${user.name} <${user.email}>`
```

Exceptions: classes are fine when a framework/library expects them (React error boundaries, certain ORM models, etc.). Document the exception in a code comment.

## How to verify

- Grep for `\\blet\\b` and `^function` in your source — both should be rare/nonexistent.
- Configure a lint rule (e.g., ESLint `no-var`, `prefer-const`, `func-style: ['error', 'expression']`) to catch drift.
