Perform a deep multi-pass review of the changes in this branch. Pass 1 checks correctness. Pass 2 runs parallel sub-agents — one per pattern group — so each reviewer focuses on a single concern. Pass 3 is a gap analysis between the docs and the implementation. Fix issues between passes. Do not ask for confirmation; begin immediately.

## Reviewer selection

Each pass below is written as if Codex MCP is the reviewer. **If the `mcp__codex__codex` tool is available, use it exactly as specified.** If Codex is not available, run the same review via an Agent sub-agent instead (Claude as the reviewer). Use the same prompt text; drop the Codex-specific parameters (`model`, `config`, `sandbox`, `approval-policy`). The rest of the structure — passes, parallelism, fix-between-passes — is identical either way.

## Setup

1. Run `git diff HEAD --name-only` to list changed files. If there are no changes, say so and stop.
2. Run `pwd` to capture the absolute working directory. You will pass it as `cwd` to every Codex session.
3. If `$ARGUMENTS` is provided, treat it as additional context (a focus area or file filter).

## Pass 1: Correctness

Launch a Codex session using `mcp__codex__codex` with:

- `prompt`: `"/review"`
- `model`: `"gpt-5.3-codex"`
- `config`: `{ "reasoning_effort": "high" }`
- `sandbox`: `"danger-full-access"`
- `approval-policy`: `"never"`
- `cwd`: the absolute working directory from Setup

This runs Codex's `/review` skill against the current diff.

When it returns, fix every blocker. Fix warnings where the fix is straightforward. Then move to Pass 2.

## Pass 2: Pattern Compliance (parallel sub-agents, one per group)

Determine the pattern groups dynamically from the project:

1. Look at `docs/technical/patterns/`. If the directory doesn't exist or has no pattern content, **skip Pass 2** — say "no documented patterns; skipping Pass 2" and move to verification.
2. If patterns are organized into subdirectories (e.g., `patterns/global/`, `patterns/typescript/`, `patterns/backend/`), use the subdirectory names as your groups.
3. If patterns are flat `.md` files directly under `patterns/`, cluster them into **3–8 groups** by concern (e.g., `code-style`, `types`, `data-layer`, `errors`). Use the diff to prioritize groups the changes actually touch; skip groups irrelevant to the diff.
4. When in doubt, prefer fewer, broader groups over many narrow ones. Fewer than 3 loses the parallelism payoff; more than 8 thins out each review.

Launch one sub-agent per group **in parallel** (all in one message) via the Agent tool with:

```
description: "Review {GROUP} pattern group"
prompt: "Call the Codex MCP tool (`mcp__codex__codex`) with these parameters:
  - model: 'gpt-5.2'
  - config: reasoning_effort: 'high'
  - sandbox: 'danger-full-access'
  - approval-policy: 'never'
  - cwd: {absolute working directory}
  - prompt: 'Review these pattern docs: {list of .md paths for this group}. Then review the current changes in this repo (`git diff HEAD`) against those patterns. Focus only on the {GROUP} group. For each violation: report the file, line range, rule name with bracket reference (e.g., [code-style.md]), and one or two sentences on what''s wrong. Distinguish blockers (MUST/NEVER) from warnings (SHOULD/PREFER). If no violations, say so explicitly. Do not make any code changes — only report findings.'

If `mcp__codex__codex` is not available in your tools, skip the Codex call and perform the review yourself using the same prompt. Either way, return the reviewer's findings verbatim."
```

Wait for all sub-agents to return. Aggregate findings. Fix every issue.

## Verification

Run the project's verification command. Look for it in this order:

1. A `verify`, `ci`, or equivalent script in `package.json` / the project's build config.
2. A command documented in `docs/technical/stack.md` or `docs/technical/runbooks/`.
3. The project's test suite as a fallback.

If nothing is defined and you're unsure, ask the user what to run. If verification fails, fix the issues and re-run until it passes.

## Pass 3: Gap Analysis

The docs describe what the system should do. The code is what it actually does. This pass finds the gap between them — places where the implementation has drifted from (or outrun, or under-delivered) the documented design.

After verification, launch a **new** Codex session using `mcp__codex__codex` with:

- `prompt`: "Review the staged and unstaged changes in this repo (`git diff HEAD`) and identify the gaps between them and the project's documentation. The docs (`docs/product/` and `docs/technical/`) are the source of truth for what the system should do. Your job is to find where the code and docs disagree — behavior the code implements that isn't documented, behavior the docs describe that the code doesn't deliver, contradictions between the two, or cases where the code's shape makes sense but the docs still describe the old shape. Use the `search_docs` MCP tool to find docs related to what changed — search for the concepts, features, and behaviors the changes touch. For each gap, report: the file and line range in the code, the doc file and section that disagrees, what the code does vs what the doc says, and whether the code or the doc is likely the one that's out of date. If there are no gaps, say so explicitly. Do not rewrite anything — just identify the gaps."
- `model`: `"gpt-5.2"`
- `config`: `{ "reasoning_effort": "high" }`
- `sandbox`: `"danger-full-access"`
- `approval-policy`: `"never"`
- `cwd`: the absolute working directory from Setup

**Do not fix anything from Pass 3.** This pass is advisory — present the reviewer's findings to the user verbatim as the final output. If the user wants to turn these gaps into follow-ups, they'll run `/research-gaps` next.

## Output

```
## Deep Review Complete

### Pass 1: Correctness
- Issues found: <count>
- Fixed: <count>

### Pass 2: Pattern Compliance — parallel
- {Group A}: <found>/<fixed>
- {Group B}: <found>/<fixed>
- ...

### Verification
- `<command>`: <pass/fail>

---

### Pass 3: Gap Analysis
<Full reviewer findings here — do not summarize, do not truncate.>
```

## Rules

- If Codex MCP is available, Passes 1 and 3 use `mcp__codex__codex` with the specified model and reasoning. Pass 2 sub-agents each call Codex internally.
- If Codex MCP is not available, every pass runs via Claude — direct in the main session for Passes 1 and 3, via parallel Agent sub-agents for Pass 2. Use the same prompt text; drop the Codex-specific parameters.
- Every Codex call must include `cwd` set to the absolute working directory, plus `sandbox: "danger-full-access"` and `approval-policy: "never"`.
- Passes are strictly sequential at the pass level: Pass 1 → fix → Pass 2 → fix → verify → Pass 3. Do not skip fixes between passes.
- Each Pass 2 sub-agent reviews only its assigned group and must not report findings from other groups.
- Launch all Pass 2 sub-agents in a single message; do not wait between them.
