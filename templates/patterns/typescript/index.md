---
title: TypeScript — Review Checklist
summary: Compiled checklist of TypeScript code-style and type rules.
groups: [typescript]
tags: [typescript]
---

# TypeScript — Review Checklist

> Compiled checklist for the `typescript/` group. Read this during review; consult source docs for rationale and examples.

## Code Style

- NEVER use `let` — only `const`. If a value must change, return a new value from a function. [code-style.md]
- NEVER use `function` declarations for exported logic — use arrow consts. [code-style.md]
- NEVER use classes for plain logic — use functions and objects unless a framework requires a class. [code-style.md]
- MUST put guard clauses at the top of functions and exit early with `return` or `throw`. [code-style.md]
- MUST keep the happy path unindented so functions read top-to-bottom. [code-style.md]
- PREFER extracted helpers or a `switch` on a discriminated union over long `else if` chains. [code-style.md]

## Types

- NEVER use `enum` — use string literal unions. [types.md]
- NEVER use `any` without a documented rationale in a code comment. [types.md]
- PREFER discriminated unions over boolean flags or inheritance for variant behavior. [types.md]
- PREFER `type` aliases over `interface` unless declaration merging is actually needed. [types.md]
- PREFER `unknown` over `any` when you genuinely don't know the shape; then narrow. [types.md]
