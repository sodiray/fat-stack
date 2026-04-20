---
title: React — Review Checklist
summary: Compiled checklist of React-specific component and state rules.
groups: [react]
tags: [react]
---

# React — Review Checklist

> Compiled checklist for the `react/` group. React-specific rules that complement the framework-agnostic `frontend/` group.

## Components

- MUST use PascalCase for component names and files (`AgentCard.tsx`, not `agent-card.tsx`). [components.md]
- MUST use semantic HTML (`<button>`, `<nav>`, `<section>`, `<header>`, `<main>`) rather than `<div>` soup. [components.md]
- MUST use named exports for components, not default exports. [components.md]
- MUST type props as an explicit `type` alias named `Props`. [components.md]
- MUST give every data-fetching component a loading state and an error state. [components.md]
- PREFER function components with hooks over class components in all cases. [components.md]
- PREFER composition (children / render props / component slots) over boolean prop explosions. [components.md]

## State

- MUST keep local UI state (open/closed, hover, focus, draft input) in `useState` or `useReducer`. [state.md]
- MUST keep shared, app-wide state (current user, active workspace, navigation) in a store (Zustand, Redux, Jotai, or equivalent). [state.md]
- MUST read from stores via selectors that return the narrowest slice needed — never select the whole store. [state.md]
- MUST flow state updates one direction: events → actions → store → components. [state.md]
- NEVER put server data in a client store — use a server-state library (TanStack Query, SWR, tRPC) with its own cache. [state.md]
- NEVER mutate store state directly — go through actions. [state.md]
- PREFER lifting state to the nearest common parent, not to a store, when the scope is obvious. [state.md]
