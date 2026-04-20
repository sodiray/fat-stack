# fat-stack

**Fully Aligned Tooling** — an opinionated set of Claude Code skills for a document-first engineering workflow.

Fat-stack turns Claude Code into a disciplined collaborator for a specific way of building software:

1. **Document the product** — what are we building and why.
2. **Document the technical approach** — how it works, before any code.
3. **Implement** — from the docs, not from the prompt.
4. **Identify the gap** — where does the implementation disagree with the docs.
5. **Close the gap** — reconcile code and docs until they tell the same story.
6. **Iterate.**

The skills are the rails for that loop.

## Install

Pick the line that matches your situation. Paste into Claude Code, or run it in a terminal.

### New project (empty directory)

**Tell Claude Code:**

> I'm starting a new project. Run `npx fat-stack@latest init --agent` and walk me through the setup — this is a greenfield project.

**Or from a terminal:**

```bash
mkdir my-project && cd my-project
npx fat-stack@latest init
```

### Existing project

**Tell Claude Code:**

> Run `npx fat-stack@latest init --agent` and walk me through the setup. This is an existing codebase.

**Or from a terminal:**

```bash
cd my-project
npx fat-stack@latest init
```

### What happens

- **Agent mode (`--agent`)** — the CLI prints a guide. Claude walks you through the setup decisions (Codex, CLAUDE.md overwrite, etc.), then re-invokes the CLI with your answers as flags.
- **Terminal mode (no flag)** — interactive TTY setup. Same outcome, no agent in the loop.

Both modes auto-detect greenfield vs. existing from the directory contents. If detection is wrong, override with `--project-mode greenfield|existing`.

For a full reference on every option, see [`docs/init-config.md`](./docs/init-config.md).

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
| `/check-launch-ready` | Determine whether the implementation is ready for end-to-end user testing. |
| `/ensure-docs-consistent` | Reconcile documentation consistency across the whole docs directory. |
| `/product` | Product advisor mode. |
| `/eng` | Founding-engineer advisor mode. |
| `/study` | Orient on the current project using its documentation. |

Skills install as flat slash commands by default (`/dev`, not `/fat-stack:dev`). `/fat-help` is the one exception — it's always prefixed to avoid colliding with Claude Code's built-in `/help`. Opt into prefixing the rest via `--skill-prefix=yes`.

## Dependencies

Fat-stack's document-first loop depends on the project having a `docs/` tree split into `docs/product/` and `docs/technical/`, plus a searchable index. That's what **[fat-docs](https://github.com/rayepps/fat-docs)** provides. The `fat-stack init` CLI runs `fat-docs init` for you.

Codex MCP is optional. If installed, `/deep-review` uses it as a second-opinion reviewer in parallel with Claude.

## Uninstall

```bash
npx fat-stack@latest uninstall
```

Removes the skills fat-stack installed. Project-level files (`CLAUDE.md`, `.mcp.json`, `docs/`) are left alone.

## License

MIT.
