---
title: Observability
summary: Structured logging everywhere, correlation IDs threaded across boundaries, no console.* in production code.
groups: [global]
tags: [global, observability]
---

# Observability

- **Status**: Accepted

## TL;DR (hard rules)

- **NEVER** use `console.log`, `console.warn`, or `console.error` in production code. Use a structured logger.
- **NEVER** import a logging SDK (pino, winston, bunyan, log4js) directly in a call site — wrap it in your project's logger module and import from there.
- **MUST** use structured (JSON or key-value) log output. Every log line should be machine-queryable.
- **MUST** propagate a **correlation ID** across every boundary (HTTP request → queue job → downstream call → LLM trace). Generate at the entry point; log it on every line.
- **MUST** log with **scoped (child) loggers** for each request/job/activity — never log with the root logger inside a handler.
- **MUST** name log events descriptively and use **consistent field names** across modules (e.g., always `userId`, never mixing `userId` / `user_id` / `uid`).

## Preferences

- **PREFER** redacting secrets automatically at the logger layer (fields named `password`, `token`, `authorization`, `apiKey`) over asking each caller to remember.
- **PREFER** logging at the boundary where context is richest (request handler, activity wrapper) and passing the scoped logger through.
- **PREFER** metrics for counts and durations; use logs for events and context.

## Why no `console.*`

`console.*` produces unstructured output. You can't filter by field, can't aggregate by request ID, can't alert on patterns. In production, logs are a product surface — they're how you understand what your system did last Tuesday at 3am. `console.log` throws that away.

## Why correlation IDs

A single user action often fans out across many services: browser → API → queue → worker → downstream API → LLM → response. Without a shared ID on every log line, you cannot reconstruct what happened.

Generate a correlation ID (sometimes called `requestId`, `traceId`, `particleId`) at the outermost entry point. Thread it through every call. Include it on every log line and in outbound HTTP headers (`X-Request-ID`, `traceparent`). When investigating an issue, search logs by that one ID and see the full story.

## Structured logger pattern

Wrap your logging library in a project module. Call sites import from that module, never from the underlying SDK.

```ts
// src/logger.ts
import pino from 'pino'

const root = pino({
  redact: ['password', 'token', 'authorization', 'apiKey', '*.password', '*.token'],
  formatters: { level: (label) => ({ level: label }) },
})

export const loggers = {
  api: () => root.child({ service: 'api', env: process.env.NODE_ENV, gitSha: process.env.GIT_SHA }),
  worker: () => root.child({ service: 'worker', env: process.env.NODE_ENV, gitSha: process.env.GIT_SHA }),
}
```

Call sites:

```ts
import { loggers } from '../logger'

const logger = loggers.api()

export const handleRequest = (req) => {
  const requestId = req.headers['x-request-id'] ?? randomUUID()
  const log = logger.child({ requestId, path: req.url, method: req.method })

  log.info({ userId: req.auth.userId }, 'request received')
  // ... do work, passing `log` through to helpers that need it
}
```

## Anti-patterns

**Logging inside a loop without the scoped logger:**

```ts
// Bad — no correlation, no context
items.forEach((item) => {
  console.log('processing', item.id)
})

// Good — scoped logger carries requestId, userId, etc.
items.forEach((item) => {
  log.debug({ itemId: item.id }, 'processing item')
})
```

**Stringly-typed messages:**

```ts
// Bad — `orderId=42 user=5 status=paid` is hard to parse
log.info(`orderId=${orderId} user=${userId} status=paid`)

// Good — structured fields are queryable
log.info({ orderId, userId, status: 'paid' }, 'order paid')
```

**Catching and swallowing:**

```ts
// Bad — error disappears
try {
  await doWork()
} catch (err) {
  console.error('failed', err)
}

// Good — log with structure, then rethrow or handle explicitly
try {
  await doWork()
} catch (err) {
  log.error({ err, step: 'doWork' }, 'work failed')
  throw err
}
```

## How to verify

- Grep for `\bconsole\.(log|warn|error|info|debug)\b` in source — should return nothing outside of explicitly allowed files (test output, local dev scripts).
- Grep for direct SDK imports (`import pino from 'pino'`) — should only appear in your logger module.
- Sample a few production requests by correlation ID — you should be able to reconstruct the full trace.
- Configure a lint rule (`no-console`) with exceptions only where justified.
