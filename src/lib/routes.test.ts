import { describe, expect, it } from 'vitest';

import { hrefOf, routeOf } from './routes.ts';

describe('routeOf', () => {
  it.each([
    ['/field-wolf/', 'home'],
    ['/field-wolf', 'home'],
    ['/field-wolf/index.html', 'home'],
    ['/field-wolf/fauna', 'fauna'],
    ['/field-wolf/flora/', 'flora'],
    ['/field-wolf/setup', 'setup'],
    ['/field-wolf/species', 'species'],
    ['/field-wolf/nope', 'missing'],
  ])('Given the path %s, when routed, then the route is %s', (path, route) => {
    expect(routeOf(path, '/field-wolf/')).toBe(route);
  });

  it('Given a page, when linked, then the href sits under the base', () => {
    expect(hrefOf('home', '/field-wolf/')).toBe('/field-wolf/');
    expect(hrefOf('fauna', '/field-wolf/')).toBe('/field-wolf/fauna');
  });
});
