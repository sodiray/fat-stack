---
title: Global — Review Checklist
summary: Stack-agnostic rules that apply everywhere in the codebase.
groups: [global]
tags: [global]
---

# Global — Review Checklist

> Compiled checklist of stack-agnostic rules. Read this file during pattern review; consult the source docs for rationale and examples.

## WET-First Design

- MUST default to inline, duplicated logic at call sites when the same code appears a small number of times. [wet-first-design.md]
- MUST extract when drift between copies would break the platform (identifier formats, serialization, protocol contracts, authorization). [wet-first-design.md]
- SHOULD follow the rule of three: extract only when a rule appears in three real places AND drift would cause a real bug. [wet-first-design.md]
- SHOULD extract as a pure, deterministic function first — no database, no network, no time, no randomness, no hidden state. [wet-first-design.md]
- NEVER create "utils" or "helpers" modules as dumping grounds for unrelated cross-cutting logic. [wet-first-design.md]
- NEVER extract logic "because it looks reusable" with no concrete drift risk. [wet-first-design.md]

## Observability

- NEVER use `console.log` / `console.warn` / `console.error` in production code — use a structured logger. [observability.md]
- NEVER import a logging SDK (pino/winston/etc.) directly at a call site — wrap it in a project logger module. [observability.md]
- MUST emit structured (JSON or key-value) log output with consistent field names. [observability.md]
- MUST generate a correlation ID at the outermost entry point and propagate it across every boundary. [observability.md]
- MUST log with request/job-scoped child loggers, not the root logger, inside handlers. [observability.md]
- PREFER redaction at the logger layer for common secret field names (`password`, `token`, `authorization`, `apiKey`). [observability.md]
