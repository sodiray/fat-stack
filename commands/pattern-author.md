Author a new pattern doc, or update an existing one, for the rule described in this conversation or in `$ARGUMENTS`. Do not ask for confirmation; begin immediately.

## What a pattern is

A pattern is a **rule the codebase follows** — a concrete, enforceable convention that `/dev` obeys when writing code and `/deep-review` checks against. Patterns answer questions like "how do we structure API endpoints?" "when do we extract shared logic?" "what goes in a service vs a module?" "how do we handle errors?"

Patterns are **not** tutorials, explainers, or general advice. They are load-bearing rules with MUST/NEVER teeth. If a pattern doesn't tell the reader what they MUST do and NEVER do, it isn't a pattern — it's documentation for some other skill.

## Where patterns live

`docs/technical/patterns/` is organized into **topic groups**, one group per broad concern:

```
docs/technical/patterns/
├── overview.md           # the group index (ships from fat-docs)
├── global/               # stack-agnostic rules
│   ├── index.md          # compiled checklist for the group
│   ├── wet-first-design.md
│   └── observability.md
├── typescript/
│   ├── index.md
│   ├── code-style.md
│   └── types.md
└── backend/
    ├── index.md
    ├── api-endpoints.md
    └── errors.md
```

Each group has:
- **`index.md`** — the compiled review checklist listing every rule in the group as one-liners with back-references. This is what `/deep-review` reads in bulk.
- **One file per pattern** (`wet-first-design.md`, `code-style.md`) — the full doc with rules, rationale, examples, and anti-patterns.

A flat layout (`patterns/errors.md` with no group folder) is fine for small projects. Move to groups once you have more than a handful.

## The pattern doc anatomy

Every pattern file follows this structure. Match it exactly — the review skills depend on these conventions.

### 1. YAML front matter

```yaml
---
title: "API Endpoints"
summary: "Every endpoint file exports three symbols: schema, endpoint, and tRPC procedure. Logic lives in the endpoint function so tests can call it directly."
groups: [backend]
tags: [backend, backend/api]
---
```

- `title` — quoted, title case.
- `summary` — 1–2 sentences. Lead with the rule, not the context.
- `groups` — array of group names (usually one: `[backend]`, `[global]`, `[typescript]`).
- `tags` — the group plus any sub-topic (`[backend, backend/api]`).

### 2. H1 + status line

```markdown
# API Endpoints

- **Status**: Accepted
- **Last updated**: 2026-04-10
```

Status is `Accepted`, `Proposed`, or `Deprecated`. Include `Last updated` on any pattern that has been revised.

### 3. TL;DR (hard rules)

Open with a bulleted list of every hard rule in the pattern. No rationale, no examples — just the rules, one per line. Each bullet starts with one of:

- **MUST** — positive requirement. Violation is a blocker in review.
- **NEVER** / **MUST NOT** — negative requirement. Violation is a blocker.
- **SHOULD** — strong guideline. Violation is a warning.
- **SHOULD NOT** — strong negative guideline. Warning.
- **PREFER** — soft preference. Warning at most.
- **EXCEPTION** — explicit carve-out to a rule above.

Example:

```markdown
## TL;DR (hard rules)

- **MUST** export three named symbols per endpoint file: `schema`, `endpoint`, and a named procedure.
- **MUST** put business logic in a manager, not the `endpoint` function.
- **NEVER** inline handler logic into `.query(...)` — it can't be unit-tested without booting the tRPC stack.
- **NEVER** read `process.env` in an endpoint — use the config module.
- **SHOULD** keep the `endpoint` function under ~20 lines of orchestration.
```

This section is load-bearing. An agent running `/deep-review` reads the TL;DR and applies each rule against the diff. Write every rule so a reviewer could mechanically answer "did this change violate it, yes or no?"

### 4. Preferences (optional)

If the pattern has soft preferences distinct from hard rules, put them in their own bulleted section:

```markdown
## Preferences

- **PREFER** arrow consts over function declarations, even for non-exported helpers.
- **PREFER** object literals with methods over classes when you just need grouped functions.
```

Skip this section if every rule is already in the TL;DR.

### 5. Why (for non-obvious patterns)

One to three paragraphs explaining the motivation. Why is this rule worth enforcing? What breaks without it? What were the alternatives?

Skip this section when the rule speaks for itself ("NEVER use `let` — only `const`" needs no essay).

### 6. The pattern (the body)

Explain how to follow the rule. Organize with H2/H3 headings that match the reader's likely path. Cover:

- **Where the rule applies** — file paths, surface areas, layers.
- **What belongs inside** — the shape of correct code.
- **What doesn't** — anti-patterns in code.
- **Required exports / shape / naming** — use tables when structure is tabular.

Include at least one **canonical example** (good code, labeled as the correct shape):

````markdown
## Canonical example

```ts
// packages/api/src/web/connections/list.ts
export const schema = z.object({ agentId: z.string() })

export const endpoint = async ({ ctx, input }) => {
  const connections = Connections.manager()
  return connections.listForAgent(ctx.session.workspaceId, input.agentId)
}

export const listConnections = authedProcedure.input(schema).query((ctx) => endpoint(ctx))
```
````

### 7. Anti-patterns

Every pattern ships at least one anti-pattern. Show what's WRONG, then what's RIGHT. This is the single highest-leverage section for agents — they pattern-match WRONG/RIGHT pairs well.

````markdown
## Anti-patterns

### Business logic in the endpoint

```ts
// WRONG — domain rules in the endpoint
export const endpoint = async ({ ctx, input }) => {
  const connection = await ctx.db.connections.find({ id: input.connectionId })
  if (!connection) throw new TRPCError({ code: 'NOT_FOUND' })
  // 40 lines of scope comparison, vault decryption, app hook dispatch...
}

// RIGHT — endpoint delegates to a manager
export const endpoint = async ({ ctx, input }) => {
  const connections = Connections.manager()
  return connections.ensureReady(input.connectionId)
}
```
````

### 8. How to verify

List mechanical checks a reviewer (human or agent) can run to verify compliance. Grep queries, lint rules, observable properties of the diff. Keep it concrete — "the endpoint function has fewer than ~20 lines" beats "the endpoint is short."

```markdown
## How to verify

- Every endpoint file exports `schema`, `endpoint`, and a named procedure.
- No endpoint file contains inline `.query(async ({ ctx, input }) => { /* logic */ })`.
- No endpoint reads `process.env` — grep for it.
- No endpoint imports a third-party SDK directly.
```

### 9. Related patterns

Close with relative links to sibling patterns. This is how `/deep-review` walks from one rule to the next.

```markdown
## Related patterns

- [managers.md](./managers.md) — where business logic lives
- [services.md](./services.md) — where external-system calls live
- [../database/queries.md](../database/queries.md) — avoid N+1 in endpoints
```

## The group index.md

When you add or rename a pattern, update the group's `index.md`. It's a compiled checklist — one rule per line, grouped by sub-topic, with a back-reference to the source file.

Conventions:
- YAML front matter (`title`, `summary`, `tasks` or `groups`, `tags`).
- One H2 per sub-topic, matching source file names.
- One rule per line starting with `MUST` / `NEVER` / `SHOULD` / `PREFER` / `EXCEPTION`.
- Each line ends with `[source-file.md]`.
- No examples, no rationale — those live in the pattern file.
- Keep under ~200 lines so it fits in a single review prompt.

Example slice:

```markdown
## API Endpoints

- MUST export `schema`, `endpoint`, and a named procedure per file. [api-endpoints.md]
- MUST put business logic in a manager, not the endpoint. [api-endpoints.md]
- NEVER inline handler logic into `.query(...)`. [api-endpoints.md]
- NEVER read `process.env` in an endpoint. [api-endpoints.md]
```

## Authoring workflow

1. **Search existing patterns.** Use `search_docs` to check whether this rule already lives somewhere. If it does, update the existing file instead of creating a duplicate.
2. **Decide the group.** Which group does this belong to? If none fits, check whether it's a new group (create `docs/technical/patterns/<group>/index.md`) or a flat file directly under `patterns/`.
3. **Write the TL;DR first.** Before prose, write the bullet list of MUST/NEVER/SHOULD rules. If you can't state the rule as a bullet, the pattern isn't ready.
4. **Add the canonical example and at least one anti-pattern.** If you can't produce a WRONG/RIGHT pair, the rule isn't concrete enough.
5. **Write "How to verify."** If no mechanical check exists, flag it — the rule may be too vague for an agent to enforce.
6. **Update the group's `index.md`.** Every TL;DR bullet becomes one line in the checklist, with `[filename.md]` at the end.
7. **Update `patterns/overview.md` "Documents" section** only if you created a new group directory — add a one-line entry pointing at the group's `index.md`.
8. **Run `index_docs`** to rebuild the search index.

## Rules

- **Every bullet in the TL;DR is a rule, not a description.** If it doesn't start with MUST / NEVER / SHOULD / PREFER / EXCEPTION, rewrite it until it does.
- **MUST and NEVER are blockers.** Use them only for rules that should fail review. Soft preferences go under SHOULD/PREFER.
- **Anti-patterns are mandatory.** Every pattern ships with at least one WRONG/RIGHT code pair.
- **Cross-link with relative paths.** `./managers.md`, not `/docs/technical/patterns/backend/managers.md`.
- **No narrative doc masquerading as a pattern.** If the file doesn't enforce a rule, move it under `docs/technical/` somewhere else and use `/technical-author`.
- **Keep the TL;DR exhaustive.** Every rule the reviewer should enforce must be in the bullet list. If a rule only appears in prose, a reviewer will miss it.
- **Under 500 lines.** Split long patterns into multiple files under the same group.
