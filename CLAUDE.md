# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
# Run all tests (Node built-in test runner + TypeScript type check)
npm test

# Run only the JS tests
node --test

# Run only the TypeScript type tests
npm run test-ts
```

The `pretest` script creates a symlink so the TypeScript tests can resolve `kensington-fastify` from the local source rather than an installed package.

## Architecture

This is a single-file Fastify plugin (`index.js`) with a matching TypeScript declaration file (`index.d.ts`). There are no build steps — the published files are the source files.

**Plugin internals (`index.js`)**

The plugin avoids the `fastify-plugin` package dependency by manually setting `Symbol.for('skip-override')` on the plugin function via the inline `fp()` helper. This is required so that `reply.renderView` and `reply.locals` decorators are visible outside the plugin's encapsulation scope.

`reply.renderView` and `reply.locals` are set up in `onRequest` hooks rather than as static decorators, because Fastify's decorator system doesn't support per-request reset of mutable objects; the hook ensures `reply.locals` starts as `{}` on every request.

Locals merge order (later wins): `defaultContext` → `reply.locals` → `options` passed to `renderView`. The `buildLocals` option bypasses this merge entirely and replaces it with a custom function.

The `htmlValidator` runs after `reply.send()` via a fire-and-forget `Promise.resolve()` so it never blocks the HTTP response.

**Tests (`test.js`)**

Uses Node's built-in `node:test` module with `fastify.inject()` for all assertions — no separate HTTP server needed.

**TypeScript tests (`tests/typescript/type-tests.ts`)**

Type-only tests compiled with `noEmit: true`. Uses `@ts-expect-error` to assert that incorrect usages are caught by the type checker.

**Example app (`example/`)**

A runnable demo showing layouts, per-request locals, alternate layouts, and layout-less fragment responses. Requires the `kensington` package (peer). Run with `node example/server.js` from the repo root.
