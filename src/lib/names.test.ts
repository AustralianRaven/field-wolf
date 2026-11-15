import { describe, expect, it } from 'vitest';

import { displayName } from './names.ts';

describe('displayName', () => {
  it.each([
    ['common poppy', 'Papaver rhoeas', 'Common poppy'],
    ['Laughing Kookaburra', 'Dacelo novaeguineae', 'Laughing Kookaburra'],
    [null, 'Metrosideros nervulosa', 'Metrosideros nervulosa'],
  ])('Given the common name %s, when displayed, then it reads %s', (common, sci, expected) => {
    expect(displayName(common, sci)).toBe(expected);
  });
});
