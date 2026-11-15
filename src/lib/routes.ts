/** Route parsing, kept pure so it can be tested without the app. */

export type Route = 'home' | 'flora' | 'fauna' | 'setup' | 'species' | 'missing';
export type Page = Exclude<Route, 'missing'>;

/** The route for a pathname under `base` (which ends with a slash, such as "/field-wolf/"). */
export function routeOf(pathname: string, base: string): Route {
  const bare = base.replace(/\/$/, '');
  let rest: string;
  if (pathname === bare) rest = '';
  else if (pathname.startsWith(base)) rest = pathname.slice(base.length);
  else rest = pathname.replace(/^\//, '');
  const seg = rest.replace(/\/+$/, '').split('/')[0] ?? '';
  if (seg === '' || seg === 'index.html' || seg === '404.html') return 'home';
  if (seg === 'flora' || seg === 'fauna' || seg === 'setup' || seg === 'species') return seg;
  return 'missing';
}

export const hrefOf = (page: Page, base: string) => (page === 'home' ? base : `${base}${page}`);
