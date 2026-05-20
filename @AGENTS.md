# kensington-fastify — Agent Guide

This file is for AI coding assistants helping developers use the `kensington-fastify` package.

## What this package does

`kensington-fastify` is a Fastify plugin that adds `reply.renderView()` and `reply.locals` to every response object. It is designed for use with [`kensington`](https://github.com/ryanlsimms/kensington), a library that builds HTML using plain JavaScript functions instead of a template engine. Renderers are just functions that return something with a `.toString()` method.

## Mental model

- A **page renderer** is a function `(locals) => html` — it renders the page body.
- A **layout renderer** is a function `(locals, pageRenderer) => html` — it wraps the page body with chrome (nav, head, footer, etc.).
- **locals** is a plain object built by merging: `defaultContext` (static, set at registration) → `reply.locals` (per-request, set in hooks) → `options` passed directly to `renderView` (per-call). Later values win.

## Setup

Register once at app startup. All options are optional.

```js
import Fastify from 'fastify';
import kensingtonView from 'kensington-fastify';
import defaultLayout from './views/layout.js';

const fastify = Fastify();

await fastify.register(kensingtonView, {
  defaultLayout,
  defaultContext: { appName: 'My App' },
});
```

## Rendering a page

Pass a page renderer function to `reply.renderView`. The response is sent immediately with `Content-Type: text/html`.

```js
fastify.get('/', async (request, reply) => {
  reply.renderView(homePage, { title: 'Home' });
});
```

Do **not** `return` or `await` `reply.renderView` — it calls `reply.send()` internally and returns `void`.

## Writing renderers

Page and layout renderers receive `locals` as a plain object. Use the `kensington` `t` helper to build HTML, or return any value with a `.toString()` method.

```js
// views/home.js
import { t } from 'kensington';

export default function homePage({ title, user }) {
  return t.main([
    t.h1(`Welcome, ${user.name}`),
    t.p(title),
  ]);
}
```

```js
// views/layout.js
import { t } from 'kensington';

export default function layout(locals, page) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head(t.title(locals.title)),
    t.body([
      t.header(t.nav(locals.appName)),
      t.main(page(locals)),
    ]),
  ]);
}
```

## Per-request locals

Use `reply.locals` in a `preHandler` hook to attach data (e.g. the current user) without passing it to every `renderView` call.

```js
fastify.addHook('preHandler', async (request, reply) => {
  reply.locals.user = await getUserFromSession(request);
});

fastify.get('/dashboard', async (request, reply) => {
  // locals will include { appName, user, title }
  reply.renderView(dashboardPage, { title: 'Dashboard' });
});
```

`reply.locals` is reset to `{}` on every request — do not persist state across requests by writing to it outside a hook.

## Alternate layouts

Pass `layout` in the options to override the default layout for one route:

```js
import adminLayout from './views/layout-admin.js';

fastify.get('/admin', async (request, reply) => {
  reply.renderView(adminPage, { layout: adminLayout, title: 'Admin' });
});
```

## No layout (bare HTML fragments)

Pass `layout: null` to skip the layout entirely. Use this for HTMX swap targets or any route that should return a partial:

```js
fastify.get('/items/:id/row', async (request, reply) => {
  const item = await getItem(request.params.id);
  reply.renderView(() => itemRow(item), { layout: null });
});
```

## Custom locals builder

Use `buildLocals` when you need full control over locals construction (e.g. to pull data from the request without using hooks). When provided, it **completely replaces** the default merge — `defaultContext` and `reply.locals` are not automatically included.

```js
await fastify.register(kensingtonView, {
  defaultLayout,
  buildLocals: (request, reply, options) => ({
    ...options,
    user: request.user,
    csrfToken: request.csrfToken(),
  }),
});
```

## HTML validation (dev only)

Pass `htmlValidator` to check rendered markup after each response. It runs after `reply.send()` so it never blocks the client.

```js
import { HtmlValidate } from 'html-validate';

const htmlvalidate = new HtmlValidate();

await fastify.register(kensingtonView, {
  defaultLayout,
  htmlValidator: process.env.NODE_ENV !== 'production'
    ? async (html) => {
        const report = await htmlvalidate.validateString(html);
        if (!report.valid) console.warn(report.results);
      }
    : undefined,
});
```

## TypeScript

All options and reply decorations are fully typed. Import `PageRenderer` and `LayoutRenderer` for annotating renderer functions:

```ts
import type { PageRenderer, LayoutRenderer } from 'kensington-fastify';

const homePage: PageRenderer = ({ title }) => `<h1>${title}</h1>`;

const layout: LayoutRenderer = function (locals, page) {
  return `<html><body>${page(locals)}</body></html>`;
};
```

`LayoutRenderer` is typed with `this: FastifyReply` so layout functions have access to the reply object via `this` (use a regular `function`, not an arrow function, when you need it).

## What to avoid

- **Do not `await reply.renderView()`** — it returns `void`, not a promise.
- **Do not return `reply.renderView()`** from a route handler — `reply.send()` is already called internally.
- **Do not write to `reply.locals` in a route handler** if you also rely on it being set in a hook — hooks run before the handler so any value set in the handler is included in locals, but if you're debugging a missing local, check hook ordering.
- **Do not pass `buildLocals` and also expect `defaultContext` / `reply.locals`** to appear in locals automatically — `buildLocals` replaces the merge entirely.
- **Do not use arrow functions for layout renderers** if you need `this` (the `FastifyReply`) — arrow functions don't bind `this`.
