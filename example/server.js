import Fastify from 'fastify';
import kensingtonView from 'kensington-fastify';
import { t } from 'kensington';

import defaultLayout from './views/layout.js';
import adminLayout from './views/layout-admin.js';
import homePage from './views/home.js';
import itemsPage, { itemRow } from './views/items.js';
import adminPage from './views/admin.js';

const fastify = Fastify({ logger: true });

// ─── in-memory store ──────────────────────────────────────────────────────────

const items = [
  { id: 1, name: 'Apples' },
  { id: 2, name: 'Bananas' },
  { id: 3, name: 'Cherries' },
];

// ─── plugin ───────────────────────────────────────────────────────────────────

await fastify.register(kensingtonView, {
  defaultLayout,
  defaultContext: {
    appName: 'Demo App',
    navLinks: [
      { href: '/', label: 'Home' },
      { href: '/items', label: 'Items' },
    ],
  },
});

// ─── per-request locals ───────────────────────────────────────────────────────

// Simulate loading the current user from a session on every request
fastify.addHook('preHandler', async (request, reply) => {
  reply.locals.user = { name: 'Guest' };
});

// ─── routes ───────────────────────────────────────────────────────────────────

fastify.get('/', async (request, reply) => {
  reply.renderView(homePage, { title: 'Home' });
});

fastify.get('/items', async (request, reply) => {
  reply.renderView(itemsPage, { title: 'Items', items });
});

// Alternate layout for the admin section
fastify.get('/admin', async (request, reply) => {
  reply.renderView(adminPage, { title: 'Admin', layout: adminLayout, items });
});

// No layout — returns a bare HTML fragment (e.g. for an HTMX swap target)
fastify.get('/items/:id/row', async (request, reply) => {
  const item = items.find(i => i.id === Number(request.params.id));
  if (!item) return reply.code(404).send('Not found');
  reply.renderView(() => itemRow(item), { layout: null });
});

// ─── start ────────────────────────────────────────────────────────────────────

await fastify.listen({ port: 3000 });
