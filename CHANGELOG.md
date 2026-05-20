# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-05-20

Initial release.

### Added

- `reply.renderView(pageRenderer, options?)` — renders a page function and sends an HTML response
- `reply.locals` — per-request plain object, reset to `{}` on each request; idiomatic place to attach hook-populated data such as the current user
- `defaultLayout` option — wraps every page renderer with a layout function
- `defaultContext` option — static object merged into locals for every render
- `buildLocals` option — custom locals builder that replaces the default merge
- `htmlValidator` option — post-send HTML validation hook, useful for dev-time linting
- Per-render `layout` override, including `layout: null` to skip the layout entirely (e.g. for HTMX fragments)
- Full TypeScript declarations (`index.d.ts`) with augmented `FastifyReply` interface
- Test suite verified against Fastify v4 and v5
