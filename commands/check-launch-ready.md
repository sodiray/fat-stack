Review the implementation from this conversation and determine whether it is ready for a user to use end-to-end. Do not ask for confirmation; begin immediately.

## What "ready for a user" means

Put yourself in the position of a user who encounters this feature for the first time. Trace every path they would take — from discovering the feature, through configuration, through normal use, through edge cases and error states. Ask: does this work completely, or does it stop halfway?

This is not a code quality review. The deep review already handled correctness, types, and patterns. This is a **completeness and usability audit**: does the implementation actually deliver what the product docs promise, end-to-end, with nothing missing?

## Step 1: Understand what was built

Review the changes made in this conversation. If `$ARGUMENTS` describes the feature or scope, use that as the focus. Identify:

- What feature or capability was implemented
- What the user-facing behavior should be (read the relevant product docs via `search_docs`)
- What the technical docs say about how this system works (read via `search_docs`)

## Step 2: Trace the user journey

Walk through every user-facing path this implementation touches:

- **Entry points**: How does the user reach this feature? Is the UI wired up? Are the routes/pages/components in place?
- **Happy path**: Does the core flow work from start to finish? Follow the data from user action → frontend → API → backend → database → response → UI update.
- **Configuration**: If the feature requires setup (connecting a service, enabling a setting, etc.), is that flow complete?
- **Feedback**: Does the user see appropriate loading states, success confirmations, and error messages?
- **Edge cases**: What happens with empty states, missing data, permissions boundaries, rate limits, concurrent access?
- **Error recovery**: When something goes wrong, does the user get a clear path back to a working state?

## Step 3: Deep research on each gap

For every gap or missing piece you find, launch a sub-agent to research it thoroughly. Each sub-agent should:

1. **Read the product docs** (`search_docs`) to confirm what should exist
2. **Read the technical docs** to understand the intended architecture
3. **Read the surrounding code** to understand what's already in place and what's missing
4. **Assess the scope** of the fix — is this a one-line addition or a multi-file implementation?

## Output format

For each issue found, produce:

### Issue {n}: {Descriptive title}

**What's missing:** Clear description of the gap — what a user would experience and why it's a problem.

**What the docs say:** What the product and/or technical docs specify should be there. File paths, section names, specific requirements.

**What the code does now:** What the current implementation provides (or doesn't). File paths, functions, the specific point where the path breaks or stops short.

**Severity:** One of:
- **Blocking** — Feature does not work end-to-end without this. A user would hit a dead end.
- **Degraded** — Feature works but the experience is noticeably incomplete (missing feedback, no error handling, broken edge case).
- **Polish** — Feature works but could be smoother. Not a blocker for shipping.

**Options:**

- **Option A: {Name}** — Concrete description of what to build/change. Which files, what the implementation looks like, estimated scope. Tradeoffs.
- **Option B: {Name}** — Alternative approach with same depth.

**Recommendation:** Which option and why.

---

After all issues, include a summary:

```
## E2E Validation Summary

**Feature:** {what was reviewed}
**Verdict:** {Ready / Ready with caveats / Not ready}

- Blocking: {count}
- Degraded: {count}
- Polish: {count}

{One paragraph: overall assessment of how close this is to shippable and what the critical path is if not ready.}
```

## Rules

- Do not create or write any files. This command is analysis only — present the results directly in the conversation.
- If the implementation is genuinely complete and ready, say so. Don't manufacture issues to fill the template.
- Focus on what a user would actually encounter, not hypothetical scenarios that require unusual conditions.
- Every issue must be grounded in specific code and specific docs — no vague "this might not work" without evidence.
- Order issues by severity (blocking first, then degraded, then polish).
- Use sub-agents in parallel for the deep research step. Each issue gets its own research agent.
