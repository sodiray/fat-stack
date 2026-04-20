Identify every open question that must be resolved before the current work can be fully planned or implemented. Do not ask for confirmation; begin immediately.

## What counts as an open question

An open question is any decision, ambiguity, or unknown that — if answered differently — would change the implementation. Examples:

- Which existing pattern or abstraction should this build on?
- Where does this data live, and how does it flow?
- Are there multiple valid approaches, and which one fits this codebase?
- Does an existing feature already handle part of this?
- What are the edge cases, and how should they behave?

If the answer is obvious from the code or docs, it is not an open question — it is a fact. State it as context and move on.

## Setup

Run `pwd` to capture the absolute working directory — you will pass it as `cwd` to every Codex session.

Summarize the current work from the conversation context: what is being planned or implemented, what systems and concepts it touches, and what decisions are already settled. This summary will be included in every Codex prompt so each session has full context.

## Step 1: Identify candidate questions

Before launching research, review the conversation and the work at hand to compile a list of candidate open questions — areas where the implementation could go multiple ways. This is a quick pass to scope the research, not the research itself.

## Step 2: Research via Codex

Spawn **one sub-agent per candidate question (or group of closely related questions) in parallel** using the Agent tool. Each agent calls Codex MCP to research its question. All sub-agents run concurrently, do not wait between them. Launch them all in a single message.

For each candidate question, launch a subagent with this content, substituting `[QUESTION]` with the specific question(s) to research and `[WORK_SUMMARY]` with the work summary from Setup:

```
description: "Research open question via Codex"
prompt: "Call the Codex MCP tool with these parameters:
- model: 'gpt-5.2'
- config: reasoning_effort: 'medium'
- sandbox: 'danger-full-access'
- approval-policy: 'never'
- cwd: (use the absolute working directory from the parent)
- prompt: 'Work context: [WORK_SUMMARY]

Question(s) to research: [QUESTION]

Research this question thoroughly using the codebase and documentation.

- Search the docs using the search_docs MCP tool. Search for the concepts, features, and systems this question touches. Read the relevant sections.
- Search the code using grep, find, and file reads. Find the actual implementations, types, schemas, and call sites related to the question. Trace the data flow.
- Check the pattern files in docs/technical/patterns/ for any rules that constrain the answer.

For each question, return:

### Q: {Question title}

**Context:** What this question is about, why it matters, and what you found in the docs and code that makes it a real decision point. Include file paths, type names, and specific details. This section should give enough context that the answer can be chosen without doing additional investigation.

**Options:**

- **Option A: {Name}** — What this option means concretely. What code/docs/patterns support it. Tradeoffs (complexity, consistency with existing patterns, migration cost, type safety implications).
- **Option B: {Name}** — Same depth.
- (as many options as genuinely exist)

**Recommendation:** Which option to choose and why, grounded in project patterns, existing code conventions, and the specific context of this work.

Rules:
- Do the research. Never write you will need to check, this depends on, or further investigation needed. If you do not know, search until you do.
- Every option must be concrete enough to act on. "We could do X" is not an option. "Add a `status` field to the job record type (src/models/job.ts), typed as `active | paused | stopped`, defaulting to `active` on insert" is an option.
- If research reveals the question has an obvious answer (one option is clearly correct), state it as a resolved decision with rationale rather than presenting fake alternatives.'"
```

## Step 3: Synthesize

Wait for all sub-agents to return, then assemble their findings into a single report:

- Deduplicate any overlapping findings
- Order questions by impact — the ones that most affect the implementation's shape come first
- If a Codex session resolved a question as obvious (no real alternatives), present it as a resolved decision rather than an open question
- If there are no genuine open questions, say so and explain why

## Output format

### Q{n}: {Question title}

**Context:** {from Codex research}

**Options:**

- **Option A: {Name}** — {concrete details, tradeoffs}
- **Option B: {Name}** — {same depth}

**Recommendation:** {grounded in patterns, code, docs}

## Rules

- Research is delegated to sub-agents (one per question or question group) using the Agent tool. Each sub-agent independently calls Codex MCP internally. Launch all sub-agents in a single message; do not wait between them.
- Every Codex call must include `cwd`, `sandbox: "danger-full-access"`, and `approval-policy: "never"`.
- Do not create or write any files. This command is research and analysis only — present the results directly in the conversation.
