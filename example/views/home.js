import { t } from 'kensington';

export default function homePage({ user }) {
  return t.section([
    t.h1('Welcome'),
    t.p(`Hello, ${user.name}! This example demonstrates kensington-fastify.`),
    t.ul([
      t.li(t.a({ href: '/items' }, 'Browse items')),
      t.li(t.a({ href: '/admin' }, 'Admin panel (alternate layout)')),
      t.li(t.a({ href: '/items/42/row' }, 'Single item row (no layout)')),
    ]),
  ]);
}
