---
title: Schema — Indexes & Constraints
summary: Every query pattern needs an index. Integrity belongs in the database, not in application code.
groups: [database]
tags: [database, database/schema]
---

# Schema — Indexes & Constraints

- **Status**: Accepted

## TL;DR (hard rules)

- **MUST** add an index for every column used in a `WHERE`, `ORDER BY`, or `JOIN` on tables that can exceed a few thousand rows.
- **MUST** use composite indexes when queries filter on multiple columns together (e.g., `workspaceId + status`).
- **MUST** declare foreign keys in the schema — never rely on application code to enforce referential integrity.
- **MUST** use `NOT NULL` on every column unless the column is genuinely optional per the domain model. Nullable-by-default is a smell.
- **MUST** add a unique index/constraint for any "at most one" business rule (dedup keys, slugs, external IDs).
- **NEVER** add a new access-pattern function without checking whether its filter columns are indexed.
- **SHOULD** declare explicit `ON DELETE` behavior on foreign keys where the relationship lifetime is clear. The default (`NO ACTION` / `RESTRICT`) is rarely what you want.

## Index rules

### Every query-pattern column needs an index

When you add a new data-layer function that filters or sorts on a column, check whether that column has an index. If not, add one in the same change.

```sql
CREATE INDEX idx_connections_workspace ON connections (workspace_id);
CREATE INDEX idx_connections_workspace_app ON connections (workspace_id, app_id);
CREATE UNIQUE INDEX uniq_connections_external ON connections (app_id, external_id);
```

- `workspaceIdx` supports `list({ workspaceId })`.
- `workspaceAppIdx` composite supports `list({ workspaceId, appId })` and `find({ workspaceId, appId })`.
- `externalIdx` supports `findByExternalId(...)` AND enforces "one connection per external ID per app."

### Composite index column order matters

A composite index on `(a, b, c)` can satisfy queries on `a`, `a + b`, and `a + b + c`, but **not** queries on `b` alone or `b + c`. Put the most-filtered column first.

### Use `EXPLAIN` to confirm

For any non-trivial query, run `EXPLAIN` (or `EXPLAIN ANALYZE`). If you see a sequential scan on a table of any real size, something's missing.

## Constraint rules

### Foreign keys in the schema, not in app code

```sql
-- Good
CREATE TABLE comments (
  id text PRIMARY KEY,
  post_id text NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  body text NOT NULL
);

-- Bad — "we'll validate in the application before insert"
CREATE TABLE comments (
  id text PRIMARY KEY,
  post_id text NOT NULL,  -- no FK, hoping app code checks
  body text NOT NULL
);
```

When the database enforces integrity, it's always enforced — even when a script, migration, or background job writes rows. Application-level checks only run when that one specific code path runs.

### `NOT NULL` by default

Every column should be `NOT NULL` unless there's a domain reason for nullability. "Might be set later" is not a domain reason — model that with a default value, a status column, or a separate table.

```sql
-- Good
ALTER TABLE users ADD COLUMN email_verified_at timestamptz;  -- genuinely optional (unverified users)
ALTER TABLE users ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

-- Bad
ALTER TABLE users ADD COLUMN created_at timestamptz;  -- nullable because "the app always sets it"
```

### Unique constraints for "at most one" rules

Any business rule that says "only one X per Y" should be a unique constraint, not application code.

```sql
-- "Only one active subscription per user"
CREATE UNIQUE INDEX uniq_active_subscription_per_user
  ON subscriptions (user_id)
  WHERE status = 'active';

-- "Slugs are unique per workspace"
CREATE UNIQUE INDEX uniq_widget_slug
  ON widgets (workspace_id, slug);
```

### Explicit `ON DELETE`

Decide what happens when a referenced row is deleted:

- `ON DELETE CASCADE` — child rows delete with the parent (owned relationships).
- `ON DELETE SET NULL` — child rows keep existing but lose the reference (optional relationships).
- `ON DELETE RESTRICT` — deletion fails if children exist (protect shared resources).

The default (`NO ACTION`) is rarely what you want. Be explicit.

## Anti-patterns

**"We'll add the index later when it's slow."** Production data grows faster than you expect. Add the index when you add the query.

**`WHERE x LIKE '%...%'` on an unindexed column.** Even indexed, a leading wildcard prevents index use. Use full-text search or a trigram index.

**"Soft deletes" without partial indexes.** If you filter `WHERE deleted_at IS NULL` everywhere, your indexes must include `deleted_at` or be partial indexes on `WHERE deleted_at IS NULL`.

## How to verify

- For every access-pattern function in your data layer, grep the schema for an index covering its filter/sort columns.
- Run `EXPLAIN` on your slowest queries; look for "Seq Scan" on tables with real row counts.
- For every unique business rule in product docs, check there's a unique index enforcing it.
