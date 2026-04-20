Help the user navigate the fat-stack methodology. Depending on the state of the conversation, either explain the loop from scratch or recommend the single most relevant next step. Do not ask for confirmation; begin immediately.

## How to decide what to do

Read the conversation. Pick one of two modes:

- **Teach mode** — the user has no clear state (new session, just finished a fresh-start, asking "how does this work"). Show the loop and skill reference below.
- **Compass mode** — there is context (user is mid-task, just shipped, is stuck). Skip the full tutorial. Recommend one skill, in one sentence, with one sentence of reasoning.

When in doubt, default to compass mode. Users who type `/fat-help` usually want guidance, not a lecture.

## The fat-stack methodology

Fat-stack is a loop with six steps:

1. **Document the product** — write what the feature *should* do, from the user's perspective. Present tense, no implementation details.
2. **Document the technical approach** — write how it works. Architecture, decisions, rationale.
3. **Implement** — derive code from the docs.
4. **Review** — check the implementation against the docs; the final pass is a gap analysis between the two.
5. **Research gaps** — turn the gaps between code and docs into reviewable follow-ups.
6. **Close gaps** — reconcile until they tell the same story.

Then go back to step 1 for the next feature or change. `docs/product/` is the source of truth for *what* the product does. `docs/technical/` is the source of truth for *how*. Code is derived from both.

## Skill reference

- **`/fresh-start`** — first run on a new project. Produces the three foundation docs (product overview, technical stack, coding patterns).
- **`/product-author`** — write or update product documentation for a specific feature or topic.
- **`/technical-author`** — write or update technical documentation for a subsystem or design.
- **`/pattern-author`** — write or update a pattern doc (a rule `/dev` and `/deep-review` enforce). Use when you're codifying a new convention.
- **`/dev`** — implement from the docs, following the patterns.
- **`/deep-review`** — thorough multi-pass review of recent changes. The final pass is a gap analysis between the docs and the implementation.
- **`/research-gaps`** — turn gaps between docs and implementation into reviewable follow-ups.
- **`/research-open-questions`** — surface every unresolved question blocking current work.
- **`/improve-plan`** — refine the current plan with three refinement passes.
- **`/research-launch-gaps`** — determine whether the implementation is ready for end-to-end testing.
- **`/ensure-docs-consistent`** — reconcile documentation consistency across the whole `docs/` directory after a change.
- **`/product`** — product advisor mode. Ask hard product questions.
- **`/eng`** — founding-engineer advisor mode. Ask hard engineering questions.
- **`/study`** — orient on the current project by reading its documentation.
- **`/fat-help`** — this skill. Shows the methodology and recommends the next step.

## Compass — common states and recommendations

Match the conversation to the closest case. Pick one recommendation. If there's a real branch, show both with the tradeoff in one line each.

- **Fat-stack is installed but there are no docs yet.** → `/fresh-start`. Foundations come first.
- **Just finished `/fresh-start`, no code yet.** → `/dev` to scaffold the initial project files from the stack doc.
- **User is describing a new feature they want to add.** → `/product-author <feature>`. Write what it does before writing how it works.
- **Product doc exists but no technical design for the subsystem they're about to build.** → `/technical-author <subsystem>`.
- **User wants to codify a new convention or rule (e.g., "we should always do X").** → `/pattern-author`. Patterns are load-bearing — `/dev` and `/deep-review` enforce them.
- **Product and technical docs exist, they're ready to build.** → `/dev`.
- **Just shipped a change, wants confidence before merging.** → `/deep-review` for a full fresh pass.
- **`/deep-review` flagged gaps between docs and code.** → `/research-gaps` to turn them into follow-ups.
- **Stuck on a decision.** → `/research-open-questions` to surface everything unresolved, then `/eng` or `/product` for an opinion on the hard ones.
- **About to start building, plan feels shaky.** → `/improve-plan`.
- **Finished implementing, ready to hand to end-to-end testing.** → `/research-launch-gaps`.
- **New teammate or returning after a break.** → `/study`.
- **User says "I don't know what to do next" and no task is clear.** → Show the full skill reference and ask: "Where are you — kicking off, writing docs, implementing, reviewing, or debugging?"

## Rules

- Recommend **one** skill per response unless there's a genuine branch. Picking is more useful than listing.
- Explain *why* that skill is the right next step in one sentence. Don't lecture.
- Slash commands dispatch from user messages, so do not invoke the recommended skill yourself. Tell the user to type it.
- If the user asks "what does `/X` do," answer from the skill reference above. If they want more detail, point them at the installed skill file — either `~/.claude/commands/X.md` (user-scope install) or `.claude/commands/X.md` in the project (project-scope install).
- Do not editorialize about fat-stack's methodology. Describe it, don't sell it.
