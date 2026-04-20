Improve the current plan. Do not ask for confirmation; begin immediately. Apply the three refinement passes below in order, updating the plan after each.

**Before starting, read `docs/technical/patterns/core-rules.md` and treat it as binding. These are the architectural and design rules that are expensive to undo if violated — every plan step must align with them.**

## Pass 1: Pattern Compliance

The project has strict coding patterns documented in `docs/technical/patterns/`. Every file in that directory (and its subdirectories) describes an accepted convention that implementation MUST follow.

Launch sub-agents to read every file in `docs/technical/patterns/` in parallel and extract all MUST, NEVER, and PREFER rules. Aggregate the full list, then audit the current plan against it. For every step in the plan that would produce code:

- Flag any step that conflicts with a pattern rule.
- Flag any step that is underspecified in a way that risks violating a pattern (e.g., "add a new endpoint" without naming the structural convention the patterns require, or "validate input" without pointing at the project's validation pattern).
- Annotate each implementation step with the specific pattern rules it must follow, so the implementer cannot miss them.

If a plan step is ambiguous about how to structure code, resolve the ambiguity by referencing the pattern docs — don't leave it to the implementer to discover.

## Pass 2: Type Strength

Review every step in the plan for type discipline. The project enforces strong typing — no shortcuts, no loose types, no `any` without explicit justification.

For each step, ensure the plan specifies:

- Concrete types for all inputs, outputs, and intermediate data. No escape hatches (untyped parameters, `any`, bare `string` or `dict` where a domain type exists) without justification.
- How new types integrate with existing type hierarchies — check the project's shared models, schema definitions, and domain types before inventing new ones.
- That generic parameters, discriminated unions, and branded/opaque IDs are used where the codebase already establishes those patterns.
- That runtime validation schemas and static types stay in sync (no parallel definitions that can drift — one is derived from the other, or they're generated together).

If a step says something vague like "add a new field" or "create a handler," specify what the type signature should look like or which existing types to extend. The implementer should never have to guess at types.

If the project is not statically typed (e.g., a pure Python or JS codebase with no type annotations), adapt this pass to the equivalent discipline — schema validation, dataclasses, protocol checks — whatever the project uses to keep data shapes honest.

## Pass 3: Clean Replacement (No Migration Scaffolding)

Review the plan for any step that introduces migration paths, deprecation layers, backward-compatibility shims, feature flags for old-vs-new, or transitional adapters. Remove them. The plan should:

- Delete the old implementation entirely when replacing it — no `@deprecated` annotations, no re-exports for backward compatibility, no "legacy" wrappers.
- Update all call sites in the same plan step that introduces the replacement, not in a separate "migration" phase.
- Never leave dead code, unused imports, or orphaned files behind.

If the plan currently has a phased migration (Phase 1: add new, Phase 2: migrate callers, Phase 3: remove old), collapse it into a single step: replace the implementation and update all references together.

## Output

Present the improved plan with all three passes applied. For each change you made, briefly note which pass drove it (pattern, typing, or clean replacement). If the original plan was already compliant in an area, say so — don't fabricate issues.
