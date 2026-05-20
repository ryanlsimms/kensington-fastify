# kensington-fastify

Fastify plugin that attaches `reply.renderView()` to each response, for use with function-based (no template engine) view rendering.

## Installation

```sh
npm install kensington-fastify
```

## Usage

```js
// views/layout.js
import { t } from 'kensington';

export default function layout(locals, page) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head(
      t.title(locals.title),
    ),
    t.body(
      page(locals),
    ),
  ]);
}
```

```js
// views/home.js
import { t } from 'kensington';

export default function homePage({ title, items }) {
  return t.main([
    t.h1(title),
    t.ul(items.map(item => t.li(item))),
  ]);
}
```

```js
// server.js
import Fastify from 'fastify';
import kensingtonView from 'kensington-fastify';
import layout from './views/layout.js';
import homePage from './views/home.js';

const fastify = Fastify();

await fastify.register(kensingtonView, {
  defaultLayout: layout,
  defaultContext: { appName: 'My App' },
});

fastify.get('/', async (request, reply) => {
  reply.renderView(homePage, { title: 'Home', items: ['foo', 'bar'] });
});
```

## API

### `kensingtonView(fastify, options)`

Fastify plugin. Register once during app setup.

| Option | Type | Description |
|---|---|---|
| `defaultLayout` | `LayoutRenderer \| null` | Wraps every page renderer. Omit or pass `null` to render pages without a layout. |
| `defaultContext` | `object` | Static data merged into locals for every render (e.g. app name, nav links). |
| `htmlValidator` | `(html: string) => void \| Promise<void>` | Called after the response is sent. Useful for dev-time HTML linting. |
| `buildLocals` | `(request, reply, options) => object` | Custom locals builder. When provided, replaces the default locals merging logic entirely. |

The plugin also decorates each reply with `reply.locals` (an object, reset to `{}` per request), the idiomatic place to attach per-request data such as the current user.

### `reply.renderView(pageRenderer, options?)`

Renders and sends an HTML response with `Content-Type: text/html`.

| Parameter | Type | Description |
|---|---|---|
| `pageRenderer` | `(locals) => { toString() }` | Renders the page content. |
| `options` | `object` | Merged into locals. Pass `layout` to override the default layout for this response. |

Locals available to both renderers are merged in this order (later values win):

1. `defaultContext` (plugin option)
2. `reply.locals`
3. `options` passed to `renderView`

## Per-request locals

Use `reply.locals` in a hook to attach request-scoped data (e.g. the current user) without passing it explicitly to every `renderView` call:

```js
await fastify.register(kensingtonView, {
  defaultLayout: layout,
  defaultContext: { appName: 'My App' },
});

fastify.addHook('preHandler', async (request, reply) => {
  reply.locals.user = await getUserFromSession(request);
});

fastify.get('/', async (request, reply) => {
  reply.renderView(homePage, { title: 'Home' });
  // locals: { appName, user, title }
});
```

## Layouts

To use an alternate layout for a route, pass it as `layout`:

```js
// views/admin-layout.js
import { t } from 'kensington';

export default function adminLayout(locals, page) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head(
      t.title(locals.title),
    ),
    t.body([
      t.nav('Admin'),
      page(locals),
    ]),
  ]);
}
```

```js
// server.js
import adminLayout from './views/admin-layout.js';

fastify.get('/admin', async (request, reply) => {
  reply.renderView(adminPage, { layout: adminLayout, title: 'Admin' });
});
```

To skip the layout entirely for a route, pass `layout: null`. This is useful for returning bare HTML fragments (e.g. for HTMX swap targets):

```js
reply.renderView(myFragment, { layout: null });
```

## HTML validation

Pass a `htmlValidator` function to report markup issues during development. It runs after the response is sent so it never blocks the client:

```js
import { HtmlValidate } from 'html-validate';

const htmlvalidate = new HtmlValidate();

async function htmlValidator(html) {
  const report = await htmlvalidate.validateString(html);
  if (!report.valid) console.warn(report.results);
}

await fastify.register(kensingtonView, {
  defaultLayout: layout,
  htmlValidator: process.env.NODE_ENV !== 'production' ? htmlValidator : undefined,
});
```
