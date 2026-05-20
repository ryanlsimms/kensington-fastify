import { t } from 'kensington';

export default function adminLayout(locals, page) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title(`Admin – ${locals.appName}`),
    ]),
    t.body([
      t.header(
        t.nav([
          t.strong('Admin Panel'),
          t.a({ href: '/' }, ' ← Back to site'),
        ]),
      ),
      t.main(page(locals)),
    ]),
  ]);
}
