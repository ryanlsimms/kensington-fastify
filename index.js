// Equivalent of fastify-plugin: marks the plugin to skip Fastify's encapsulation
// so that decorators are available in the parent scope.
function fp(fn, meta = {}) {
  fn[Symbol.for('skip-override')] = true;
  fn[Symbol.for('fastify.display-name')] = meta.name ?? fn.name;
  fn[Symbol.for('plugin-meta')] = meta;
  return fn;
}

async function kensingtonView(fastify, opts) {
  const { defaultLayout = null, htmlValidator = null, buildLocals = null, defaultContext = {} } = opts;

  fastify.decorateReply('locals', null);
  fastify.decorateReply('renderView', null);

  fastify.addHook('onRequest', (request, reply, done) => {
    reply.locals = {};

    reply.renderView = function renderView(pageRenderer, options = {}) {
      const locals = typeof buildLocals === 'function'
        ? buildLocals(request, reply, options)
        : {
            ...defaultContext,
            ...reply.locals,
            ...options,
          };

      const layoutRenderer = Object.hasOwn(options, 'layout') ? options.layout : defaultLayout;

      let html;
      if (typeof layoutRenderer === 'function') {
        html = layoutRenderer.call(reply, locals, pageRenderer.bind(reply)).toString();
      } else {
        html = pageRenderer(locals).toString();
      }

      reply.type('text/html').send(html);

      if (typeof htmlValidator === 'function') {
        Promise.resolve(htmlValidator(html)).catch(err => {
          fastify.log.error(err, 'kensington-fastify: htmlValidator rejected');
        });
      }
    };

    done();
  });
}

export default fp(kensingtonView, {
  fastify: '>=4',
  name: 'kensington-fastify',
});
