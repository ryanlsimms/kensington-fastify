import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

export function runSuite(Fastify, kensingtonView) {
  // ─── plugin registration ─────────────────────────────────────────────────────

  describe('kensingtonView', () => {
    it('decorates reply with renderView and calls done', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView);
      fastify.get('/test', async (request, reply) => {
        assert.equal(typeof reply.renderView, 'function');
        reply.send('ok');
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      assert.equal(res.statusCode, 200);
    });

    it('initialises reply.locals to {} per request', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView);
      fastify.get('/test', async (request, reply) => {
        assert.deepEqual(reply.locals, {});
        reply.send('ok');
      });
      await fastify.inject({ method: 'GET', url: '/test' });
    });
  });

  // ─── reply.renderView ────────────────────────────────────────────────────────

  describe('reply.renderView', () => {
    it('renders page without layout when defaultLayout is omitted', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView);
      fastify.get('/test', async (request, reply) => {
        reply.renderView(() => '<p>hello</p>');
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      assert.equal(res.body, '<p>hello</p>');
      assert.ok(res.headers['content-type'].includes('text/html'));
    });

    it('renders page inside default layout', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView, {
        defaultLayout: (locals, page) => `<html>${page(locals)}</html>`,
      });
      fastify.get('/test', async (request, reply) => {
        reply.renderView(() => '<p>hello</p>');
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      assert.equal(res.body, '<html><p>hello</p></html>');
    });

    it('overrides layout per-render', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView, {
        defaultLayout: (locals, page) => `<default>${page(locals)}</default>`,
      });
      fastify.get('/test', async (request, reply) => {
        reply.renderView(() => '<p>hello</p>', {
          layout: (locals, page) => `<alt>${page(locals)}</alt>`,
        });
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      assert.equal(res.body, '<alt><p>hello</p></alt>');
    });

    it('skips layout when options.layout is null', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView, {
        defaultLayout: (locals, page) => `<html>${page(locals)}</html>`,
      });
      fastify.get('/test', async (request, reply) => {
        reply.renderView(() => '<p>hello</p>', { layout: null });
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      assert.equal(res.body, '<p>hello</p>');
    });

    it('merges locals: defaultContext < reply.locals < options', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView, {
        defaultContext: { a: 'ctx', b: 'ctx' },
      });
      fastify.get('/test', async (request, reply) => {
        reply.locals.b = 'reply';
        reply.locals.c = 'reply';
        reply.renderView(
          (locals) => JSON.stringify({ a: locals.a, b: locals.b, c: locals.c, d: locals.d }),
          { c: 'options', d: 'options' },
        );
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      const body = JSON.parse(res.body);
      assert.equal(body.a, 'ctx');
      assert.equal(body.b, 'reply');
      assert.equal(body.c, 'options');
      assert.equal(body.d, 'options');
    });

    it('uses buildLocals to construct locals when provided', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView, {
        buildLocals: (request, reply, options) => ({
          method: request.method,
          ...options,
        }),
      });
      fastify.get('/test', async (request, reply) => {
        reply.renderView(
          (locals) => JSON.stringify({ method: locals.method, foo: locals.foo }),
          { foo: 'bar' },
        );
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      const body = JSON.parse(res.body);
      assert.equal(body.method, 'GET');
      assert.equal(body.foo, 'bar');
    });

    it('propagates render errors to Fastify error handler', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView);
      fastify.get('/test', async (request, reply) => {
        reply.renderView(() => { throw new Error('render failed'); });
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      assert.equal(res.statusCode, 500);
    });

    it('propagates layout errors to Fastify error handler', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView, {
        defaultLayout: () => { throw new Error('layout failed'); },
      });
      fastify.get('/test', async (request, reply) => {
        reply.renderView(() => '<p>hello</p>');
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      assert.equal(res.statusCode, 500);
    });

    it('layout receives reply as this context', async () => {
      const fastify = Fastify({ logger: false });
      let capturedThis;
      await fastify.register(kensingtonView, {
        defaultLayout: function (locals, page) {
          capturedThis = this;
          return page(locals);
        },
      });
      fastify.get('/test', async (request, reply) => {
        reply.renderView(() => 'ok');
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      assert.equal(res.statusCode, 200);
      assert.ok(capturedThis != null);
      assert.equal(typeof capturedThis.send, 'function');
    });
  });

  // ─── htmlValidator ───────────────────────────────────────────────────────────

  describe('htmlValidator', () => {
    it('is called with rendered html after send', async () => {
      let capturedHtml;
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView, {
        htmlValidator: async (html) => { capturedHtml = html; },
      });
      fastify.get('/test', async (request, reply) => {
        reply.renderView(() => '<p>hello</p>');
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      assert.equal(res.statusCode, 200);
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(capturedHtml, '<p>hello</p>');
    });

    it('send is not blocked by validator', async () => {
      let resolveValidator;
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView, {
        htmlValidator: () => new Promise(resolve => { resolveValidator = resolve; }),
      });
      fastify.get('/test', async (request, reply) => {
        reply.renderView(() => '<p>hello</p>');
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      assert.equal(res.statusCode, 200);
      resolveValidator();
    });

    it('validator rejection does not affect response', async () => {
      const fastify = Fastify({ logger: false });
      await fastify.register(kensingtonView, {
        htmlValidator: async () => { throw new Error('validation failed'); },
      });
      fastify.get('/test', async (request, reply) => {
        reply.renderView(() => '<p>hello</p>');
      });
      const res = await fastify.inject({ method: 'GET', url: '/test' });
      assert.equal(res.statusCode, 200);
      assert.equal(res.body, '<p>hello</p>');
      await new Promise(resolve => setImmediate(resolve));
    });
  });
}
