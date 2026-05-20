import Fastify, { type FastifyReply } from 'fastify';
import kensingtonView from 'kensington-fastify';
import type { PageRenderer, LayoutRenderer } from 'kensington-fastify';

// ─── plugin registration ─────────────────────────────────────────────────────

const _a = Fastify();
_a.register(kensingtonView);
_a.register(kensingtonView, {});
_a.register(kensingtonView, { defaultContext: { appName: 'My App' } });

const layout: LayoutRenderer = function(locals, page) {
  return page(locals);
};

_a.register(kensingtonView, { defaultLayout: layout });

_a.register(kensingtonView, {
  defaultLayout: layout,
  defaultContext: { appName: 'My App', nav: ['Home', 'About'] },
  htmlValidator: async (html: string) => { console.log(html); },
});

_a.register(kensingtonView, {
  defaultLayout: layout,
  htmlValidator: (html: string) => { console.log(html); },
});

_a.register(kensingtonView, {
  buildLocals: (request, reply, options) => ({ method: request.method, ...options }),
});

// @ts-expect-error - htmlValidator must be a function
_a.register(kensingtonView, { htmlValidator: 'not a function' });

// ─── reply.renderView augmentation ───────────────────────────────────────────

declare const reply: FastifyReply;
declare const pageRenderer: PageRenderer;
declare const altLayout: LayoutRenderer;

reply.renderView(pageRenderer);
reply.renderView(pageRenderer, { layout: altLayout });
reply.renderView(pageRenderer, { layout: null });
reply.renderView(pageRenderer, { title: 'Home', items: ['foo', 'bar'] });

// @ts-expect-error - pageRenderer is required
reply.renderView();

// @ts-expect-error - pageRenderer must be a function
reply.renderView('not a function');

// ─── reply.locals ─────────────────────────────────────────────────────────────

const _c: Record<string, unknown> = reply.locals;
reply.locals['flash'] = ['saved!'];

// ─── renderer signatures ──────────────────────────────────────────────────────

const _page: PageRenderer = (locals) => `<p>${locals['title']}</p>`;

const _layout: LayoutRenderer = function(locals, page) {
  return `<html>${page(locals)}</html>`;
};

// layout receives reply as `this`
const _layoutWithThis: LayoutRenderer = function(locals, page) {
  const _self: FastifyReply = this;
  return page(locals);
};
