# CLAUDE.md

This project uses **fat-stack** — a document-first engineering workflow for Claude Code.

## The loop

Every change follows this order:

1. **Document the product** (`/product-author`) — what should exist, written in present tense as if it already does.
2. **Document the technical approach** (`/technical-author`) — how it works, before any code.
3. **Implement** (`/dev`) — derive code from the docs, not from the prompt.
4. **Review** (`/deep-review`) — verify the implementation matches the docs; the final pass is a gap analysis between the two.
5. **Research gaps** (`/research-gaps`) — turn the gaps between code and docs into reviewable follow-ups.
6. **Close gaps** — reconcile until they tell the same story.
7. **Iterate.**

`docs/product/` is the source of truth for product intent. `docs/technical/` is the source of truth for technical design. Code is derived from both.

If you're not sure where you are in the loop or what to run next, start with `/fat-help`.

## Skills

| Skill | Role |
|---|---|
| `/fresh-start` | Produce the three foundation docs (product overview, technical stack, coding patterns). Run first on greenfield projects. |
| `/fat-help` | Explain the methodology and recommend the next step to run based on where you are. |
| `/product-author` | Write or update product documentation for the current topic. |
| `/technical-author` | Write or update technical documentation for the current topic. |
| `/pattern-author` | Write or update a pattern doc — a rule `/dev` and `/deep-review` enforce. |
| `/dev` | Implement from the docs, following the project's coding patterns. |
| `/deep-review` | Full multi-pass review of changes, including a gap analysis between docs and implementation. Uses Codex in parallel if installed. |
| `/research-gaps` | Turn gaps between documentation and implementation into reviewable follow-ups. |
| `/research-open-questions` | Surface every unresolved question blocking the current work. |
| `/improve-plan` | Refine the current plan with the three refinement passes. |
| `/research-launch-gaps` | Determine whether the implementation is ready for end-to-end user testing. |
| `/ensure-docs-consistent` | Reconcile documentation consistency across the whole docs directory. |
| `/product` | Product advisor mode. |
| `/eng` | Founding-engineer advisor mode. |
| `/study` | Orient on the current project using its documentation. |

## Docs

`docs/` is managed by **fat-docs**. Use the `search_docs` MCP tool to find relevant docs before grepping or globbing — the docs folder uses semantic search, and keyword searches miss relevant files. After any change to `docs/`, rebuild the index with `index_docs`.

Every doc file starts with YAML front matter (`title`, `summary`, `tasks`) and stays under 500 lines. Split larger docs into an overview + sub-documents.

## Project

<!--
  This section is populated by /fresh-start. It describes what this project is,
  who it's for, and the stack. Leave the placeholders until fresh-start runs.
-->

**What this project is:** _populated by /fresh-start_

**Who it's for:** _populated by /fresh-start_

**Stack:** _populated by /fresh-start_

**Product docs:** `docs/product/overview.md`
**Technical docs:** `docs/technical/stack.md`
