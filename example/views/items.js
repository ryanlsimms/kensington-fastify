import { t } from 'kensington';

export default function itemsPage({ items }) {
  return t.section([
    t.h1('Items'),
    t.ul({ id: 'item-list' }, items.map(({ id, name }) => itemRow({ id, name }))),
  ]);
}

export function itemRow({ id, name }) {
  return t.li({ id: `item-${id}` }, name);
}
