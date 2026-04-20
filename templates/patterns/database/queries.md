---
title: Query Efficiency
summary: Push access patterns into dedicated query functions. Never call single-row fetches in a loop.
groups: [database]
tags: [database, database/queries]
---

# Query Efficiency

- **Status**: Accepted

## TL;DR (hard rules)

- **NEVER** call a single-row fetch inside a `for` loop or `Promise.all(ids.map(...))` — that's N+1. Add a `listByIds(ids)` function to your data layer.
- **NEVER** fetch parent rows, then fetch children per parent in application code, then join in JavaScript. Express the access pattern as one or two queries at the data layer.
- **NEVER** run a raw query inline in a handler or job "just this once" to avoid adding a data-layer function. The next caller copies you and the access pattern spreads across the codebase.
- **MUST** add a new function to your database module whenever an access pattern doesn't fit existing `create` / `find` / `list` / `update` / `remove` helpers.
- **MUST** name access-pattern functions by what they answer, not by what tables they touch (`listForAgent`, `findActiveSubscriptionsExpiringBefore`, `countByStatus`).

## Why this matters

A single page load or job tick can explode into dozens of queries when callers fetch one row at a time in a loop. This is the single most common database performance problem in any codebase, and the fix is always the same: push the access pattern down into a dedicated function where it can be expressed as one query (or a handful).

## The rule

When you need data in a non-trivial shape, stop and ask:

1. **Can the existing `find` / `list` / CRUD functions return what I need?** Use them.
2. **Am I about to call one of them inside a loop, map, or Promise.all?** Stop. Add a new access-pattern function.
3. **Am I about to write a raw `SELECT` in a handler or job?** Stop. That's a new access pattern — add it to the data layer.

The caller makes **one** call per distinct access pattern, not N calls in a loop.

## Worked examples

### Parallel `find` per ID

**Bad:**

```ts
const conversations = await Promise.all(
  conversationIds.map((id) => db.conversations.find({ id }))
)

const agents = await Promise.all(
  agentIds.map((id) => db.agents.find({ id }))
)
```

Even with `Promise.all`, this is N+1 — it sends N queries in parallel instead of one query with `IN (...)`.

**Good:**

```ts
// In packages/db/src/conversations.ts
export const listByIds = (ids: string[]) =>
  db.select().from(conversations).where(inArray(conversations.id, ids))

// In packages/db/src/agents.ts
export const listByIds = (ids: string[]) =>
  db.select().from(agents).where(inArray(agents.id, ids))

// In the caller:
const [conversations, agents] = await Promise.all([
  db.conversations.listByIds(conversationIds),
  db.agents.listByIds(agentIds),
])
```

### Parent → children join

**Bad:**

```ts
const posts = await db.posts.listForAuthor(authorId)
const enriched = []
for (const post of posts) {
  const comments = await db.comments.listForPost(post.id)
  enriched.push({ ...post, comments })
}
```

**Good:**

```ts
// Express the join once, in the data layer
export const listPostsWithCommentsForAuthor = async (authorId: string) => {
  const rows = await db
    .select()
    .from(posts)
    .leftJoin(comments, eq(posts.id, comments.postId))
    .where(eq(posts.authorId, authorId))

  // group rows by post in application code, but it's one query
  return groupByPostId(rows)
}
```

### Raw query in a handler

**Bad:**

```ts
// In an API endpoint
const rows = await db.execute(
  sql`SELECT p.*, COUNT(c.id) AS comment_count FROM posts p LEFT JOIN comments c ON c.post_id = p.id WHERE p.author_id = ${authorId} GROUP BY p.id`
)
```

**Good:**

```ts
// Move the query into the data layer as a named access pattern
export const listPostsWithCommentCountsForAuthor = (authorId: string) => {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      commentCount: count(comments.id),
    })
    .from(posts)
    .leftJoin(comments, eq(comments.postId, posts.id))
    .where(eq(posts.authorId, authorId))
    .groupBy(posts.id)
}

// The handler becomes one line
const rows = await db.posts.listPostsWithCommentCountsForAuthor(authorId)
```

## How to verify

- Grep for `Promise.all(.*\.map.*find\b` in source — every match is a potential N+1.
- Grep for direct `db.select` / `db.execute` / raw SQL outside the data-layer module — each should be a known exception or moved.
- Profile slow endpoints and look for N queries in the trace where 1 should suffice.
