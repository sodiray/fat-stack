# The fat-stack methodology

fat-stack is a document-first workflow for building software with Claude Code. This document explains the ideas behind the loop: what each step is for, why the order matters, and why most of your time ends up in the docs rather than the code.

If you're starting out, read this top to bottom once. If you're already using fat-stack, treat this as a reference.

## Docs as source of truth

Most projects treat docs as commentary on code. The code is primary; the docs (if they exist) explain it after the fact, drift, and decay.

fat-stack inverts that. The docs are the source of truth for what the application is supposed to be. The code is an artifact that catches up over time.

That inversion changes everything downstream:

- If the docs describe a feature that doesn't exist yet, that's fine — the intent is recorded, and the code will converge to it.
- If the code does something the docs don't describe, that's a gap to close — by writing the doc or removing the behavior.
- If the docs and the code disagree, the docs win by default.

### What lives in the docs

**Product docs (`docs/product/`)** describe what the application does from the user's perspective:

- Features and their behavior
- The concepts and domains the product operates on
- User-facing flows and outcomes

**Technical docs (`docs/technical/`)** describe how the application is built:

- Architecture and subsystem responsibilities
- Design decisions and their rationale
- Patterns that code must follow (enforced via `/dev` and `/deep-review`)

Both are written in present tense, as if the feature already works. "The billing page shows the current plan and usage." Not "We will add a billing page." Present tense forces clarity: either the doc describes real behavior, or it doesn't, and you notice the gap.

### What does NOT live in the docs

- Plans ("next sprint we'll do X")
- Migration strategies ("to roll this out, first we...")
- TODOs, known gaps, in-progress work
- Status reports, changelogs, release notes

Keep those elsewhere — an issue tracker, a `plans/` folder, the commit log. Product and technical docs describe the app as it should be, full stop. That's what makes them useful to the agent: when Claude reads them, it gets a clean specification, not a mix of "here's how it works" and "here's what we're hoping to change."

## The loop, in depth

The loop has six steps. Each step has a skill that runs it.

### 1. Write product docs — `/product-author`

Describe what the feature does, in present tense. Focus on user-facing behavior and the concepts involved. No implementation details.

**Done when:** a new reader can read the product doc and know what the feature is for, who uses it, and what it does.

### 2. Write technical docs — `/technical-author`

Describe how the feature works. Architecture, subsystem responsibilities, key decisions and their rationale.

**Done when:** a new engineer can read the technical doc and have a mental model of how it's built without reading the code.

### 3. Plan — `/improve-plan`

Derive a concrete implementation plan from the docs. Claude proposes the plan; you refine it until it holds together. `/improve-plan` runs three refinement passes.

**Done when:** the plan is small enough to hold in your head and covers every piece of behavior the docs describe.

### 4. Implement — `/dev`

Claude reads the relevant docs and patterns and writes the code. You're reviewing at the decision layer — "does this pattern still hold?", "is this detail in the right doc?" — not at the line layer.

**Done when:** the code runs, the relevant tests pass, and `/check-launch-ready` gives the go-ahead.

### 5. Gap analysis — `/deep-review`

`/deep-review` does a multi-pass review. The final pass is specifically a gap analysis: where does the code disagree with the docs?

**Done when:** every gap is named. Some will be code bugs. Some will be doc omissions. Some will be intentional drift you want to keep.

### 6. Reconcile — `/research-gaps`

For each gap, decide: update code, update docs, or accept as intentional. `/research-gaps` turns gaps into reviewable follow-ups so you can work through them deliberately.

**Done when:** the code and docs tell the same story.

Then you go back to step 1 for the next change.

## Doc-only mode

You don't have to write code to make progress.

Spend a day — or a week — just writing product and technical docs. Argue with Claude via `/product-author` and `/technical-author`. Push back on your own decisions. Refactor the docs. Let the shape of the app settle before you commit to code.

This is the mode that feels most alien coming from pure vibe coding. It's also where fat-stack's leverage is highest. By the time you reach `/dev`, the intent is nailed down; the implementation is faster because it's been thought through; and the agent has a rich source to pull from instead of piecing intent together from prompts.

Doc-only mode is especially useful when:

- You're unsure what you're actually building. Write the product doc until you know.
- The system is getting complex. Write the technical doc until the pieces fit.
- You're between features and want to refactor. Start by refactoring the docs; the code follows.

## How code converges to docs

Once the docs describe what you want, the skills automate the rest:

1. `/improve-plan` — refine the plan until it holds together.
2. `/dev` — implement the plan.
3. `/deep-review` — find gaps between docs and what was built.
4. `/research-gaps` — turn gaps into concrete follow-ups.
5. `/check-launch-ready` — verify the feature is ready for end-to-end testing.

You can run this chain with minimal code reading. You're signing off on whether gaps are acceptable, whether the plan looks right, whether the behavior described in the docs is what you want. You're not writing loops or fixing types.

## You may not need to read the code

If the docs are thorough and the loop has run, most of the time you can evaluate the system by:

- **Asking questions of it through Claude** — "how does X work?" The agent reads the docs and answers.
- **Running the application and using it** — the most direct check.
- **Reading the gap analysis from `/deep-review`** — a summary of where the code disagrees with your intent.

You read the code when:

- A gap resists reconciliation and you need to see why.
- You're debugging behavior that surprises you.
- You're making a low-level performance or security call that can't be evaluated from the docs.

Most of the time, you're in the docs, in the chat, and in the running app. Not in the editor.

## Why this works

- **Docs are the spec. Code is the compile target.** The agent has a reliable source to consult, so its output is grounded instead of guessed.
- **Gap analysis replaces line-by-line review.** You review the shape of the drift, not every diff hunk.
- **Decisions stay with you.** Claude writes; you decide. Nothing ships without you editing the doc that describes it.
- **Your codebase stays legible even when you don't read it.** The docs are the legibility.

## Common objections

**"This is just TDD with docs instead of tests."**
Partly — TDD is the closest sibling methodology. The difference: tests verify behavior at runtime; docs verify intent at review time. They complement each other. Nothing stops you from writing tests too.

**"Docs rot. Why will these be different?"**
Because the loop has a step whose only job is detecting rot. Gap analysis isn't optional; it's step 5. Drift gets caught and reconciled before the next cycle begins.

**"I'll just end up writing both docs and code."**
The code is derived by the agent. You author intent by editing the doc. Claude translating doc to code is the mechanical step — you don't spend your time there.

**"What about code I've already written?"**
Run `/fresh-start` on an existing codebase. It generates the foundation docs from what's already there. From then on, iterate forward from the docs.

**"What if the docs are wrong?"**
Then the agent will build the wrong thing, and gap analysis will surface it. That's good — you've found a bad idea before it shipped, and the doc is cheap to fix.

## Next steps

- New to fat-stack? Run `/fresh-start` to produce the foundation docs.
- Not sure where you are in the loop? Run `/fat-help` — it will recommend the next step.
- Want to codify a rule `/dev` enforces? Run `/pattern-author`.
