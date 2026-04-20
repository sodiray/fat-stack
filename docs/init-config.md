# fat-stack init configuration reference

This is the deep reference for every option `fat-stack init` accepts. The `fat-stack init --agent` guide links here.

Options are invoked as CLI flags:

```
npx fat-stack@latest init --agent \
  --project-mode greenfield \
  --install-codex-mcp yes
```

Only the flags you set are applied; everything else takes its default.

---

## `--project-mode`

**Values:** `greenfield` | `existing` | `auto`
**Default:** `auto`

Tells fat-stack whether you're installing into a new project or an existing one.

- **`greenfield`** — scaffolds `CLAUDE.md` and `.gitignore` at the project root. Use this when the directory is empty (or only has `README.md`/`LICENSE`/`.git`). Pairs with `/fresh-start` to interview the user about what they're building.
- **`existing`** — installs skills only. Does not touch `CLAUDE.md` or `.gitignore`. The return prompt tells Claude to wire fat-stack into your existing `CLAUDE.md`.
- **`auto`** *(default)* — detects based on cwd contents. Greenfield if the directory has nothing significant (beyond `.git`, `.gitignore`, `README.md`, `LICENSE`, `.github/`). Existing otherwise.

**When to override:** detection is heuristic. Override to `greenfield` if your "empty" project has a few stray files and you want the full scaffold. Override to `existing` if your project genuinely has no content yet but you don't want fat-stack writing a `CLAUDE.md`.

---

## `--install-scope`

**Values:** `user` | `project`
**Default:** `user`

Controls where the skill files live.

- **`user`** *(default)* — installs skills to `~/.claude/commands/` and tracks them in `~/.fat-stack/manifest.json`. The skills are available in every Claude Code session on this machine. This is the right default for personal use: one fat-stack install, every project sees it.
- **`project`** — installs skills to `./.claude/commands/` inside the current working directory and tracks them in `./.fat-stack/manifest.json`. Claude Code loads project-level skills alongside user-level ones, so the skills only activate inside this project. Commit `.claude/commands/` to the repo to share the exact skill set (and fat-stack version) with a team.

**Why pick `project`:**

- **Sharing with a team.** Every contributor gets the same skills without each running `fat-stack init` locally.
- **Pinning a fat-stack version to a repo.** `user` scope is whatever version you installed last globally; `project` scope is whatever version committed the files.
- **Multiple fat-stack versions on one machine.** Different projects can run different versions side by side.

**Why stick with `user`:**

- **No repo noise.** `.claude/commands/` is fifteen markdown files; some teams don't want that in the tree.
- **Solo use.** If you're the only one using fat-stack, a single user-level install is simpler — one copy to keep up to date.

**Uninstall:** `npx fat-stack@latest uninstall` removes a single install by default — project-scope if the cwd has one, otherwise user-scope. When both exist, it removes the project-scope install and warns you that a user-scope install is still present. Pass `--scope user|project|all` to target a specific install explicitly.

**Re-running with a different scope:** re-running `init` only touches the scope you specify. Switching from `user` to `project` does **not** remove the user-scope install — both coexist until you `uninstall` them. This is deliberate so that switching scopes doesn't silently throw away an existing install.

---

## `--install-codex-mcp`

**Values:** `yes` | `no`
**Default:** `no`

Installs and registers OpenAI's Codex CLI as a second-opinion reviewer MCP in this project.

**What Codex adds to fat-stack:**

- **`/deep-review` gets a second opinion.** Codex (GPT-5.2 class) reviews the same diff in parallel with Claude. Different model, different blind spots. Catches bugs the primary review misses.
- **Parallel sub-reviews for large changes.** When there are multiple independent concerns (security, performance, correctness, style), fat-stack dispatches them to parallel Codex sub-agents. Without Codex, these run sequentially through Claude.
- **Research delegation.** Long-running investigation ("find every place this pattern is used and grade its consistency") offloads to Codex so the primary conversation stays responsive.

**What gets installed when you set this to `yes`:**

1. If the `codex` CLI isn't on your `PATH`, we run `npm install -g @openai/codex`. If it's already installed (e.g. you were using Codex before), we skip.
2. We add a `codex` entry to your project's `.mcp.json`:
   ```json
   "codex": { "type": "stdio", "command": "codex", "args": ["mcp-server"] }
   ```
3. We append a concurrency rule to your project's `CLAUDE.md`, wrapped in sentinel comments so re-runs are idempotent. The rule tells Claude to dispatch multiple Codex calls through sub-agents so they run in parallel — without this, Codex serializes.
4. You run `codex login` once in your terminal. This opens your browser for ChatGPT OAuth. Works with ChatGPT Plus, Pro, Business, Edu, and Enterprise plans. API keys also work if you prefer.

**Idempotency:** if `codex` is already in this project's `.mcp.json`, the entire Codex install flow is skipped. fat-stack never reconfigures an already-configured project.

**Cost:** Codex usage counts against your ChatGPT plan's compute. For heavy use, this matters. Most users don't hit the limit.

**Skip if:** you don't use ChatGPT, you prefer Claude-only reviews, or you want to keep this project's dependency surface minimal. `/deep-review` still works without Codex — it just runs a single Claude-only pass.

---

## `--overwrite-claude-md`

**Values:** `no` | `ask` | `yes`
**Default:** `no`

Controls what greenfield mode does when `CLAUDE.md` already exists at the project root.

- **`no`** *(default)* — preserves the existing `CLAUDE.md`. You'll see a warning. If you want fat-stack's template, move your existing file aside first.
- **`yes`** — overwrites the existing `CLAUDE.md` with fat-stack's template. Destructive; no backup is taken. Only use this when you're sure your current `CLAUDE.md` is disposable.
- **`ask`** — reserved for interactive mode; falls back to `no` in agent mode.

This flag only matters when `--project-mode=greenfield` (or auto-detected greenfield). Existing mode never writes `CLAUDE.md`.

---

## `--skill-prefix`

**Values:** `no` | `yes`
**Default:** `no`

Controls whether skills install as flat slash commands (`/dev`, `/deep-review`) or namespaced (`/fat-stack-dev`, `/fat-stack-deep-review`).

- **`no`** *(default)* — flat names. Cleaner and faster to type.
- **`yes`** — every skill is prefixed with `fat-stack-`. Use this if you run multiple command packs (e.g., gstack alongside fat-stack) and want to avoid name collisions.

Changing this after install is safe: re-running `init` with a different value removes the old skill files and installs fresh.

**Exception:** `/fat-help` is always named `/fat-help` regardless of this setting. Its plain name (`/help`) would collide with Claude Code's built-in help command, so it's pre-prefixed at the source. Skills already starting with `fat-` are never double-prefixed.

**Caveat:** skill bodies refer to each other by their flat names (`/dev`, `/product-author`, etc.). If you set `--skill-prefix=yes`, those references inside the skill files won't be automatically rewritten. For now, using `--skill-prefix=yes` is a power-user choice; expect to mentally translate cross-references.

---

## `--patterns`

**Values:** `default` | `none` | `all` | comma-separated subset of `global,typescript,database,frontend,react`
**Default:** `default` (= `global`)

Seeds starter pattern docs under `docs/technical/patterns/<pack>/`. These are the rules `/dev` reads before writing code — hard MUST/NEVER items, PREFER/SHOULD guidelines, and compiled per-group checklists. You edit them to match your project; fat-stack only ships the starter set.

**Packs:**

- **`global`** — stack-agnostic rules. WET-first design (when to duplicate vs extract) and observability (structured logging, correlation IDs, no raw `console.log`). Almost every project wants this.
- **`typescript`** — TypeScript code-style rules (immutability, guard clauses, arrow consts) and type rules (no `any`, no `enum`, interface-over-type conventions).
- **`database`** — query and schema rules for SQL-heavy projects (parameterization, migrations, naming).
- **`frontend`** — framework-agnostic frontend rules (loading states, error handling boundaries).
- **`react`** — React-specific rules (component structure, state management). Usually paired with `frontend`.

**Aliases:**

- **`default`** *(default)* — installs `global` only.
- **`none`** — skips all packs; you author your own patterns from scratch.
- **`all`** — installs every pack.

**Examples:**

```
--patterns default                         # just global (the default)
--patterns global,typescript               # TS project
--patterns global,typescript,frontend,react  # React app
--patterns none                            # write your own
--patterns all                             # kitchen sink
```

**Idempotency:** detect-and-skip per file. Re-running with more packs adds them; files you've already edited are never overwritten. Removing a pack from the flag does *not* delete previously installed pack files — delete those yourself if you don't want them.

**Why this lives in fat-stack, not fat-docs:** patterns are the rules `/dev` and `/deep-review` enforce. They belong next to the skills that read them. fat-docs owns the doc structure (`docs/technical/overview.md`, `patterns/overview.md`) and the search index; fat-stack owns the rules agents apply.

---

## Notes on invocation

**Agent mode.** `--agent` is required when passing config flags. Without `--agent`, fat-stack enters interactive mode and expects a TTY, which won't work when Claude invokes the CLI. The guide fat-stack prints in agent mode lists every flag and its values.

**Idempotency.** Re-running `init` with the same flags produces the same state. Changing a flag and re-running converges to the new state (skills are removed and reinstalled, Codex concurrency rule is appended if missing, etc.). The only thing re-running never does is overwrite your `CLAUDE.md` unless you pass `--overwrite-claude-md=yes`.

**Versioning.** There's no schema version field. Each fat-stack CLI version understands only its own flags. If you upgrade fat-stack and a flag was renamed, the CLI will tell you; there's no migration step you need to run.
