Expand every gap between the documentation and the implementation flagged by the most recent deep review into a fully researched decision brief. Do not ask for confirmation; begin immediately.

## Input

Find the Gap Analysis findings from the most recent `/deep-review` in this conversation. If `$ARGUMENTS` specifies particular gaps by number or keyword, expand only those. Otherwise, expand all of them.

## Setup

Run `pwd` to capture the absolute working directory — you will pass it as `cwd` to every Codex session.

Extract each gap from the Gap Analysis findings: the code file(s) and line ranges, the doc file(s) and sections, and the one-line summary of what conflicts.

## Research via Codex

Spawn **one sub-agent per gap in parallel** using the Agent tool. Each agent calls Codex MCP to research its gap. All sub-agents run concurrently, do not wait between them. Launch them all in a single message.

For each gap, launch a subagent with this content, substituting `[INCONSISTENCY]` with the specific gap to research (code file, doc file, what conflicts):

```
description: "Research gap via Codex"
prompt: "Call the Codex MCP tool with these parameters:
- model: 'gpt-5.2'
- config: reasoning_effort: 'medium'
- sandbox: 'danger-full-access'
- approval-policy: 'never'
- cwd: (use the absolute working directory from the parent)
- prompt: 'Inconsistency to research: [INCONSISTENCY]

Research this documentation-to-code gap thoroughly.

1. **Read the code.** Open the file(s) and line ranges cited. Read enough surrounding context to understand the full behavior — not just the flagged lines but the module, its callers, its types, and its tests (if any).

2. **Read the docs.** Open the doc file(s) and section(s) cited. Also use the search_docs MCP tool to search for the topic and find any other docs that describe the same concept. Read all of them.

3. **Trace the history.** Run git log --oneline -10 -- <file> on both the code file and the doc file to understand which changed more recently and whether the drift was intentional or accidental.

4. **Determine ground truth.** Based on the code behavior, the doc description, and the git history: which one is more likely correct? Is the code ahead of the docs (feature was built but docs were not updated)? Are the docs ahead of the code (spec was written but implementation diverged)? Or is it a genuine design question where neither is clearly right?

Return your findings in this format:

### Inconsistency: {Descriptive title}

**What the deep review found:** One-line summary of the original finding.

**Code says:** What the code actually does, with file paths, function names, types, and specific behavior. Include the relevant code context — do not just say the handler does X, show what X means concretely.

**Docs say:** What the documentation claims, with file paths, section names, and the specific text. If multiple docs reference this topic, include all of them.

**History:** Which changed more recently and what the commits suggest about intent. Was this a deliberate divergence or drift?

**Why it matters:** What breaks, confuses, or misleads if this stays unresolved. Is this cosmetic (wrong term in a doc) or structural (code implements a different model than what is documented)?

**Options:**

- **Option A: {Name}** — Concrete description of what to change in code and/or docs. What files, what edits, what the end state looks like. Tradeoffs: effort, risk, consistency with the rest of the system.
- **Option B: {Name}** — Same depth. Different approach.
- (as many options as the situation warrants)

Each option should be holistic — not just update the docs or update the code but the specific combination of code and doc changes that leaves the system most correct and internally consistent.

**Recommendation:** Which option and why, based on the git history, the current architecture, and what makes the system most truthful.

Rules:
- Every option must name specific files and describe specific edits. "Update the docs to match" is not an option. "In docs/technical/sync-engine.md lines 45-52, replace the description of retry backoff with..." is an option.
- If the gap is trivial (a renamed variable, an outdated line count), say so explicitly and recommend the fix in one line rather than inflating it into a full analysis.
- If the gap is actually a deeper design problem than the deep review suggested, say so and expand the scope of the options accordingly.'"
```

## Synthesize

Wait for all sub-agents to return, then assemble their findings into a single report:

- Order by severity — structural gaps before cosmetic ones
- If a Codex session identified a trivial gap, keep its one-line recommendation rather than expanding it
- If a Codex session uncovered a deeper design problem, flag it prominently

## Rules

- Research is delegated to sub-agents (one per gap) using the Agent tool. Each sub-agent independently calls Codex MCP internally. Launch all sub-agents in a single message; do not wait between them.
- Every Codex call must include `cwd`, `sandbox: "danger-full-access"`, and `approval-policy: "never"`.
- Do not create or write any files. This command is research and analysis only — present the results directly in the conversation.
