---
title: Database — Review Checklist
summary: Compiled checklist of database query and schema rules.
groups: [database]
tags: [database]
---

# Database — Review Checklist

> Compiled checklist for the `database/` group. Read this during review; consult source docs for rationale and examples.

## Queries

- NEVER call a single-row fetch inside a `for` loop or `Promise.all(ids.map(...))` — that's N+1. Add a `listByIds(ids)` function instead. [queries.md]
- NEVER fetch parent rows, then loop to fetch children per parent in application code — push the join down to one or two queries. [queries.md]
- NEVER run a raw query inline in a handler or job "just this once" — the next caller will copy you. Add the access pattern to your data layer. [queries.md]
- MUST add a new function to the database module whenever an access pattern doesn't fit existing CRUD helpers. [queries.md]
- MUST name access-pattern functions by what they answer, not by what tables they touch (`listForAgent`, `findActiveExpiringBefore`). [queries.md]

## Schema

- MUST add an index for every column used in a `WHERE`, `ORDER BY`, or `JOIN` on tables that can exceed a few thousand rows. [schema.md]
- MUST use composite indexes when queries filter on multiple columns together. [schema.md]
- MUST declare foreign keys in the schema — never rely on application code to enforce referential integrity. [schema.md]
- MUST use `NOT NULL` on every column unless the column is genuinely optional per the domain model. [schema.md]
- MUST add a unique index/constraint for any "at most one" business rule (dedup keys, slugs, external IDs). [schema.md]
- SHOULD declare explicit `ON DELETE` behavior on foreign keys where the relationship lifetime is clear. [schema.md]
- NEVER add a new access-pattern function without checking whether its filter columns are indexed. [schema.md]
