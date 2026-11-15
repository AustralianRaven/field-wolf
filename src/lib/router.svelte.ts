/**
 * A tiny history router. Paths are relative to BASE, so "/fauna" is
 * "/field-wolf/fauna" on the site. GitHub Pages serves 404.html (a copy of
 * the app) for deep links, and the app routes itself from location.
 */
import { BASE } from './config';
import { hrefOf, routeOf, type Page, type Route } from './routes';

class Router {
  route = $state<Route>(routeOf(location.pathname, BASE));
  /** One-shot notice carried across a navigation, such as "Your setup is done". */
  flash = $state<string | null>(null);

  constructor() {
    addEventListener('popstate', () => {
      this.route = routeOf(location.pathname, BASE);
      this.flash = null;
    });
  }

  go(page: Page, flash: string | null = null): void {
    history.pushState(null, '', hrefOf(page, BASE));
    this.route = page;
    this.flash = flash;
    scrollTo(0, 0);
  }

  /** Same-tab navigation for in-app links; modified clicks still open new tabs. */
  link = (e: MouseEvent): void => {
    const a = e.currentTarget as HTMLAnchorElement | null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const route = routeOf(new URL(a.href).pathname, BASE);
    if (route === 'missing') return;
    e.preventDefault();
    this.go(route);
  };
}

export const router = new Router();
export const href = (page: Page) => hrefOf(page, BASE);
