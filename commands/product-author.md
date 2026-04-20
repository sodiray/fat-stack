Write or update product documentation for the feature or topic described in this conversation or in `$ARGUMENTS`. Do not ask for confirmation; begin immediately.

## What product docs are

Product docs are the **canonical source of truth for the desired end state of the product.** They describe what the product should look like — not what it looks like today, not how we plan to get there, not what phase we're in. When reading a product doc, you should see the finished vision as if it already exists.

This means:
- Write in present tense, as if the feature is complete ("Users can," "the dashboard shows," "the confirmation dialog appears")
- Do not include migration plans, rollout phases, timelines, or "we will eventually" language. Those are managed in project planning, not product docs.
- Do not describe the current incomplete state. If the doc says "the export format supports three delivery modes," that is the spec — even if only two are implemented today.

Every product doc should cover these concerns where relevant:

### Capabilities
What the user can do. Concrete actions, workflows, and outcomes. Not feature names in isolation — describe the experience. "Users can save a draft at any point and return to it later from the drafts list" not "Draft saving is supported."

### Boundaries and limitations
What the user cannot do, and why. Explicit constraints, quotas, permission boundaries, and intentional restrictions. If something is not supported, say so directly rather than leaving it ambiguous. If a limitation exists for a good reason (safety, simplicity, cost), explain the reasoning.

### User value
Why this matters to the user. What problem does it solve? What would they have to do without it? How does it fit into their broader workflow? This is not marketing copy — it's honest context about why the feature exists and what it makes possible.

### Design rationale
Key decisions and the reasoning behind them. Why does the product work this way and not another plausible way? If the default for a setting is conservative rather than permissive, or if a feature is intentionally scoped narrowly, say why. Users and future contributors benefit from understanding the intent, not just the behavior.

### Interactions with other concepts
How this feature connects to other parts of the product. If the feature touches multiple product areas — accounts, billing, notifications, collaboration — explain those relationships from the user's perspective. What the user sees and controls, not how the data flows internally.

### States and transitions
If the feature has meaningful states (active/paused/stopped, connected/disconnected, pending/approved/denied), describe them: what each state means to the user, how they move between states, and what triggers transitions.

## Deferred items

Occasionally, a product doc needs to describe something that is part of the desired end state but is explicitly not being built yet. Mark these with a **`[DEFERRED]`** tag inline:

> `[DEFERRED] (waiting on SSO provider contract)` Teams can sign in with their organization's identity provider and inherit role mappings automatically.

> `[DEFERRED] (blocked by mobile client v2)` Users can start a task on the web and resume it on mobile with full state preserved.

Rules for deferred items:
- The tag is `[DEFERRED]` followed by a parenthetical reason: `[DEFERRED] (reason)`
- The reason should be short — why it's deferred, not a full explanation
- The spec text after the tag still describes the desired end state, written the same way as everything else (present tense, complete)
- Use deferred sparingly. Most of the doc should describe what we are building. If an entire section is deferred, consider whether it belongs in the doc yet at all.
- Deferred items are searchable: `grep -r "DEFERRED"` across docs finds every deferred commitment

## What product docs are NOT

- **No implementation details.** No function names, no database tables, no schema definitions, no file paths, no API endpoint signatures. If you catch yourself writing a source path, a function name, a table name, or a type definition — stop and rewrite from the user's perspective.
- **No code examples.** Product docs describe behavior, not how to call it programmatically. That belongs in technical docs or API reference.
- **No architecture.** Don't describe how components communicate internally, what runs where, or how data is stored. You may describe data flow at a high level *only* when it directly explains a user-visible behavior (e.g., "updates from connected services show up in your feed in real time" is fine; "webhooks are ingested by the gateway and dispatched as workflow signals" is not).
- **No roadmap language.** No "in a future release," "we plan to," "Phase 2 will introduce," or "this will eventually support." The doc is the end state. If something isn't being built yet, use `[DEFERRED]` — don't describe a journey to get there.

## Relationship to technical docs

Product docs sit at the top of the documentation hierarchy. They define what the product does, and technical docs describe how the system achieves it. This means product docs must be self-consistent and complete on their own terms — they are the specification that technical docs must satisfy.

When writing product docs, be aware that technical authors will use them as the authoritative source for what the system needs to deliver. Every capability, boundary, and behavior you describe will need a corresponding technical design. Write with that precision: if you say "the export format supports three delivery modes," the technical doc will need to explain how all three work. Vague product specs create vague technical designs.

## Process

1. **Research the topic.** Use `search_docs` to find existing product docs and technical docs on the topic. Read the relevant code (types, models, UI components) to understand what the feature actually does — but translate everything into user-facing language in the doc.

2. **Check existing docs.** If a product doc already exists for this topic, update it rather than creating a new file. If the topic is covered partially across multiple docs, consolidate or update the most appropriate one.

3. **Write the doc.** Follow the structure above. Include YAML front matter (`title`, `summary`, and optional `groups`/`tags` per fat-docs conventions — see `docs/technical/patterns/overview.md` for the pattern-doc variant). Keep it under 500 lines.

4. **Run docs consistency.** After writing, use `search_docs` with 3-4 queries related to the topic to check if any other docs reference this feature. Update any that are now inconsistent with what you wrote.

5. **Rebuild the index.** Call the `index_docs` MCP tool.

## Writing style

- Write in second person ("you can," "your account," "your team") when describing user actions
- Be direct and specific — avoid vague language like "various options" or "multiple ways"
- State limitations plainly, don't hide them in hedging language
- Use the product's actual terminology consistently. If the product has named concepts (objects, roles, states), capitalize them as proper nouns and use the same spelling across all docs.
- Keep paragraphs short. Use headers, lists, and whitespace to make the doc scannable.
- Don't over-explain simple concepts. If something is self-evident, one sentence is enough.

## Rules

- Never include technical implementation details. This is the single most important rule.
- Always include design rationale for non-obvious decisions. If a feature works a particular way and a user might wonder "why?", answer it.
- Always state limitations explicitly rather than leaving them implied.
- Place the doc in the appropriate `docs/product/` subdirectory based on topic.
