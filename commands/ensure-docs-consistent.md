Ensure documentation consistency across the entire docs directory after a recent change. Do not ask for confirmation; begin immediately.

## Context

A docs change was just made in this conversation (or is described in `$ARGUMENTS`). That change may have introduced inconsistencies — other docs that reference the same concepts, features, or systems may now be stale or contradictory. Your job is to find every affected location and bring it in line.

## Step 1: Identify the change

Determine what changed. If `$ARGUMENTS` describes the topic, use that. Otherwise, look at the docs that were recently edited in this conversation. Extract:

- The **topic** (e.g., "session expiration," "billing plan tiers," "search ranking algorithm")
- The **key facts** that changed (new names, new behavior, removed concepts, restructured flows)
- Any **terminology changes** (renames, new terms replacing old ones)

## Step 2: Search for all related docs

Launch multiple sub-agents in parallel, each searching for related documentation using `search_docs` with different query angles:

- The primary topic name and its synonyms
- Key terms that changed (both old and new names)
- Related systems and features that reference this topic
- Any acronyms, abbreviations, or shorthand for the topic

Each sub-agent should:
1. Run `search_docs` with its query (use `top_n: 15` to cast a wide net)
2. Read the relevant sections of every result that scores above the relevance threshold
3. Return a list of files + line ranges + the specific text that references the topic

## Step 3: Aggregate and deduplicate

Collect all results from the sub-agents. Build a single list of every file and section that references the changed topic. Deduplicate by file path and section.

## Step 4: Update each location

For each affected file, read the relevant section and compare it against the change from Step 1. If the section:

- **Contradicts** the new facts — update it to match.
- **Uses old terminology** — replace with the new terms.
- **Describes a removed concept** — remove the reference or replace it with the current design.
- **Is partially correct** — update the stale parts, keep the rest.
- **Is already consistent** — skip it, don't touch it.

Make the edits directly. Keep the existing style and voice of each document — don't rewrite sections that are already correct just to make them sound like the new doc.

## Step 5: Rebuild the index

After all edits are complete, call the `index_docs` MCP tool to regenerate `guide.md`, `outline.md`, and the semantic search index so they reflect the updates.

## Step 6: Report

Output a summary:

```
## Docs Consistency Pass

**Topic:** {what changed}

### Updated
- `docs/path/file.md` (lines X–Y) — {what was changed and why}
- `docs/path/other.md` (lines X–Y) — {what was changed and why}

### Reviewed, no changes needed
- `docs/path/already-correct.md` — {why it was already consistent}

### Index rebuilt
```

## Rules

- Use `search_docs` for discovery — do not glob or grep the docs directory (per CLAUDE.md).
- Search broadly. The whole point is to catch docs you wouldn't think to check. Use at least 4-5 different search queries across the sub-agents.
- Do not rewrite docs that are already correct. Only touch what is actually inconsistent.
- Do not add new documentation. This command is about consistency, not expansion.
- Always rebuild the index at the end.
