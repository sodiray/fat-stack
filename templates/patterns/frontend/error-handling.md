---
title: Error Handling
summary: Classify errors (transient / expected / fatal), show them in the user's language, log them with full context, and wrap UI in boundaries.
groups: [frontend]
tags: [frontend, frontend/errors]
---

# Error Handling

- **Status**: Accepted

## TL;DR (hard rules)

- **MUST** classify every error on the user-facing surface:
  - **Transient** — network blip, timeout, rate limit. Retry (auto or with a button).
  - **Expected** — validation, "not found", permission. Show inline near the triggering action.
  - **Fatal** — unexpected crash in a component tree. Show an error boundary fallback.
- **MUST** show user-facing errors in the user's language. No stack traces, no `Error: EPIPE`, no JSON blobs leaking to the UI.
- **MUST** log full error context to observability — message, stack, request ID, user ID (if any), inputs. Enough to reproduce.
- **MUST** wrap significant UI trees (routes, major panels) in an error boundary so a single component failure doesn't blank the whole app.
- **NEVER** swallow errors. If a failure isn't shown to the user AND isn't logged, it didn't happen — until a support ticket arrives.

## Why classify

Different errors warrant different UX. Treating them all as "something went wrong" is lazy and frustrating.

| Class | Example | UX | Action |
|---|---|---|---|
| Transient | 504 timeout | Retry silently, or retry button | Auto-retry once, then surface |
| Expected | "Email already in use" | Inline next to the field | User fixes input |
| Fatal | Uncaught render error | Boundary fallback | Reload / report |

## Transient errors

For network/timeout/rate-limit errors, the right first action is usually a retry — either automatic (with backoff) or a button the user can press.

```tsx
const { data, error, retry } = useAgents()

if (error && isTransient(error)) {
  return (
    <div>
      <p>Couldn't load agents. The server might be busy.</p>
      <button onClick={retry}>Try again</button>
    </div>
  )
}
```

Keep the rest of the UI stable. A transient error in a sidebar list shouldn't blank the main view.

## Expected errors

Validation failures, "not found," and permission errors are part of the product. Show them **inline, next to the action that caused them.**

```tsx
const [email, setEmail] = useState('')
const [submitError, setSubmitError] = useState<string | null>(null)

const handleSubmit = async () => {
  const result = await createUser({ email })
  if (result.error) {
    setSubmitError(result.error.userMessage) // "Email already in use"
    return
  }
  // ... success path
}

return (
  <form onSubmit={handleSubmit}>
    <input value={email} onChange={(e) => setEmail(e.target.value)} />
    {submitError && <p className="error">{submitError}</p>}
    <button type="submit">Sign up</button>
  </form>
)
```

Note that the API returns a `userMessage` field — a human-readable string in the user's language, separate from the technical error message.

## Fatal errors — boundaries

A React error boundary (or equivalent in your framework) catches errors thrown during render. Wrap any significant UI tree — the whole app at minimum, and major routes/panels individually.

```tsx
<ErrorBoundary fallback={<AppCrashFallback />}>
  <Route path="/agents">
    <ErrorBoundary fallback={<AgentPageFallback />}>
      <AgentsPage />
    </ErrorBoundary>
  </Route>
</ErrorBoundary>
```

Without a boundary, a single component throwing during render takes the entire UI down to a white screen. With boundaries, one route can crash while the rest keeps working.

In the boundary's error handler, log the error to observability:

```tsx
<ErrorBoundary
  onError={(error, info) => {
    logger.error({ error, componentStack: info.componentStack }, 'UI error boundary caught')
  }}
  fallback={<AgentPageFallback />}
>
```

## User-facing messages

Every error path that reaches the UI needs a message written **for the user**, not for the developer.

**Bad:**

```
Error: ECONNREFUSED 127.0.0.1:8080
```

```
TypeError: Cannot read properties of undefined (reading 'name')
```

```
{"code":"PGRST116","message":"JSON object requested, multiple (or no) rows returned"}
```

**Good:**

```
Couldn't reach the server. Check your connection and try again.
```

```
Something went wrong loading this page. We've been notified.
```

```
That agent doesn't exist — it may have been deleted.
```

Keep a small vocabulary: ~5 generic fallback messages for the cases you haven't specifically handled. Log the raw error for debugging; show the friendly version to the user.

## Never swallow

The worst error-handling pattern:

```ts
try {
  await doRiskyThing()
} catch {
  // ignored
}
```

If this fails, the user sees nothing and nothing is logged. Support tickets show "it didn't work" and there's no trail.

If there's genuinely nothing to do — e.g., optional analytics call failing shouldn't break the flow — at minimum log it at `debug` or `info` level so you can find it if patterns emerge.

```ts
try {
  await trackEvent('signup')
} catch (err) {
  logger.debug({ err }, 'analytics tracking failed (non-blocking)')
}
```

## How to verify

- Click through the app with the network tab set to "offline." Every data-loading view should show a retryable transient error, not a blank screen or a raw error.
- Trigger a validation error in a form. The error should appear next to the field, in plain English.
- Throw `new Error('boom')` during render in a test component. The nearest error boundary should catch it; the rest of the app should keep working.
- Grep for `catch {}` or `catch (_)` in source — each is a potential swallowed error.
- Grep for `console.error\(err\)` in UI code — these should be going through your logger, and the user should see a friendly message.
