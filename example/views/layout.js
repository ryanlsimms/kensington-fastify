import { t } from 'kensington';

export default function layout(locals, page) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title(locals.title ? `${locals.title} – ${locals.appName}` : locals.appName),
    ]),
    t.body([
      t.header([
        t.nav([
          t.strong(locals.appName),
          ...locals.navLinks.map(({ href, label }) =>
            t.a({ href }, ` ${label}`),
          ),
        ]),
        t.span(`Signed in as: ${locals.user.name}`),
      ]),
      t.main(page(locals)),
      t.footer(t.p(`© ${new Date().getFullYear()} ${locals.appName}`)),
    ]),
  ]);
}
