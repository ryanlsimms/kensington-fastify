import { t } from 'kensington';

export default function adminPage({ items }) {
  return t.section([
    t.h1('Admin'),
    t.h2('Items'),
    items.length > 0
      ? t.ul(items.map(({ id, name }) => t.li(`[${id}] ${name}`)))
      : t.p('No items yet.'),
  ]);
}
