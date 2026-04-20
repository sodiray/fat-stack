Write or update technical documentation for the system, architecture, or infrastructure topic described in this conversation or in `$ARGUMENTS`. Do not ask for confirmation; begin immediately.

## What technical docs are

Technical docs are the **canonical source of truth for the desired end state of the system's architecture and design.** They describe how the system should work — not how it works today, not the migration path to get there. When reading a technical doc, you should see the finished design as if it is already built.

This means:
- Write in present tense, as if the system is complete ("the request handler validates the signature before dispatching," "the job runner retries exponentially on transient failures")
- Do not include migration plans, rollout phases, or "we will eventually" language. Those are managed in project planning, not technical docs.
- Do not describe the current incomplete state. If the doc says "the rate limiter enforces per-tenant quotas," that is the spec — even if enforcement is only partially implemented today.

## Relationship to product docs

Product docs define **what** the product does. Technical docs define **how** the system achieves it. This means technical docs must fully satisfy the product docs — every capability, boundary, and behavior described in the product spec must have a corresponding architectural design in the technical docs that explains how the system delivers it.

Before writing or updating a technical doc, search for the relevant product docs (`search_docs` in `docs/product/`) and read them. As you write, verify that your technical design accounts for every product requirement on the topic. If the product doc says "the export format supports three delivery modes," the technical doc must describe how the system implements all three — not two. If the product doc says "users see notifications in real time," the technical doc must describe the mechanism that makes that true.

If you discover that the product docs are missing something the technical design needs to account for, or that the product docs conflict with each other, flag it explicitly rather than silently choosing one interpretation.

## What technical docs cover

### System design and architecture
How the system is structured at a high level. What the major components are, what responsibilities they own, and how they relate to each other. Think in terms of systems, services, and boundaries — not functions and files.

### Data flow and communication
How data moves through the system. What triggers what, what signals what, what reads from where. This is where specificity matters most — describe the exact paths at abstraction boundaries where components connect to each other.

### Contracts and boundaries
Where systems meet: API shapes between services, event formats, message payloads, the interface between trusted and untrusted code, the boundary between components owned by different teams. Be precise here — these are the seams that multiple implementers need to agree on.

### Invariants and constraints
What must always be true. "A request with an invalid signature is rejected before reaching the handler." "Every write passes through the validation layer." "A user session can never outlive its refresh window." These are the rules that implementations must uphold.

### Design rationale
Why the architecture works this way. Why event-driven instead of polling? Why a dedicated queue per tenant instead of a shared one? Why separate read and write paths? Engineers benefit from understanding the reasoning, not just the structure.

### Failure modes and recovery
What happens when things go wrong. How does the system handle a crashed worker, a timed-out request, a failed external dependency? What retries, what drops, what alerts?

## Level of detail

Technical docs should be **detailed but resilient to refactoring.** The goal is specificity that doesn't break when someone renames a function.

**Be specific about:**
- Component names and system boundaries (whatever your project's services, workers, gateways, or modules are actually called)
- Communication paths between components (queue topics, RPC calls, webhook routes, signals — whatever the project uses)
- Data flow direction and triggers (what causes what to happen)
- Invariants and constraints (what must always hold)
- Architectural patterns and their rationale

**Avoid unless essential:**
- Function names, method names, variable names — these change frequently and make docs brittle
- Database column names and schema details — describe the data model conceptually ("each account has a usage record with a hard cap and a rolling window") not structurally ("the `usage_cap_cents` column in the `accounts` table")
- File paths and line numbers — these shift constantly
- Import paths and package internals

**When to get specific:** At abstraction boundaries and core communication paths, name the concrete interfaces. If two systems exchange a specific message type, name it. If an API endpoint is the contract between frontend and backend, describe its shape. If a workflow or queue consumer listens for specific events that other systems must emit, document those event names. The test is: would another engineer need this exact name to correctly integrate with this system?

## Deferred items

When a technical doc describes architecture that is part of the desired end state but is explicitly not being built yet, mark it with a **`[DEFERRED]`** tag:

> `[DEFERRED] (blocked by cross-region networking)` Workers in different regions coordinate via a shared event stream for global ordering.

> `[DEFERRED] (not needed until third-party plugins ship)` The plugin loader validates cryptographic signatures on external bundles before loading them.

Rules for deferred items:
- The tag is `[DEFERRED]` followed by a parenthetical reason: `[DEFERRED] (reason)`
- The spec text after the tag still describes the desired end state in present tense
- Use sparingly. If an entire section is deferred, consider whether it belongs in the doc yet.
- Searchable: `grep -r "DEFERRED"` across docs finds every deferred commitment

## What technical docs are NOT

- **No product language.** Don't describe user experiences, user value, or product positioning. "The review system keeps reviewers in control of every publish" belongs in product docs. "The review system intercepts publish requests flagged for review, records them in the pending-reviews table, and emits a `review.requested` event to subscribed reviewers" belongs in technical docs.
- **No code listings.** Don't paste implementation code. Describe behavior and contracts, not syntax.
- **No roadmap language.** No "in a future release," "Phase 2 will add," or "we plan to migrate." The doc is the end state. Use `[DEFERRED]` for things not yet being built.
- **No tutorial structure.** Technical docs describe how the system works, not how to use it step by step. That belongs in guides or READMEs.

## Process

1. **Research the topic.** Use `search_docs` to find existing technical and product docs on the topic. Read the relevant code to understand how the system actually works — but write the doc at the architecture level, not the implementation level.

2. **Check existing docs.** If a technical doc already exists for this topic, update it rather than creating a new file. If the topic is covered partially across multiple docs, consolidate or update the most appropriate one.

3. **Write the doc.** Follow the structure above. Include YAML front matter (`title`, `summary`, and optional `groups`/`tags` per fat-docs conventions — see `docs/technical/patterns/overview.md` for the pattern-doc variant). Keep it under 500 lines. If the topic is operational (how to run, deploy, debug), write it as a runbook in `docs/technical/runbooks/` instead.

4. **Run docs consistency.** After writing, use `search_docs` with 3-4 queries related to the topic to check if any other docs reference this system. Update any that are now inconsistent with what you wrote.

5. **Rebuild the index.** Call the `index_docs` MCP tool.

## Writing style

- Use precise technical language — name components, patterns, and protocols correctly
- Be direct. One clear sentence is better than a paragraph of hedging.
- Use diagrams-as-text (numbered flows, arrow notation) for complex multi-step processes
- Keep paragraphs short. Use headers, lists, and whitespace for scannability.
- Write for an engineer who is new to this part of the system but experienced overall

## Rules

- Describe architecture and design, not implementation details. This is the most important rule.
- Be precise at boundaries — name the contracts, signals, and interfaces that systems agree on.
- Stay general about internals — describe what a component does, not how its code is structured.
- Always include design rationale for non-obvious architectural decisions.
- Place the doc in the appropriate `docs/technical/` subdirectory based on topic.
