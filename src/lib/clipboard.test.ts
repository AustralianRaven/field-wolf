import { describe, expect, it } from 'vitest';

import { imageFromClipboard, isTextTarget } from './clipboard.ts';

const file = (type: string) => new File(['x'], 'pasted', { type });
const item = (kind: string, f: File) => ({ kind, type: f.type, getAsFile: () => f }) as unknown as DataTransferItem;
const clip = (files: File[], items: DataTransferItem[] = []) =>
  ({ files: files as unknown as FileList, items: items as unknown as DataTransferItemList }) as Pick<DataTransfer, 'files' | 'items'>;

describe('imageFromClipboard', () => {
  it('Given a pasted PNG file, when read, then it returns that file', () => {
    const png = file('image/png');
    expect(imageFromClipboard(clip([png])), 'Then the PNG should be picked').toBe(png);
  });

  it('Given text before an image in the files, when read, then it returns the image', () => {
    const jpg = file('image/jpeg');
    expect(imageFromClipboard(clip([file('text/plain'), jpg])), 'Then the first image should be picked').toBe(jpg);
  });

  it('Given an image only exposed as an item, when read, then it returns the item file', () => {
    const webp = file('image/webp');
    expect(imageFromClipboard(clip([], [item('string', file('text/plain')), item('file', webp)])), 'Then the item image should be picked').toBe(webp);
  });

  it.each([
    ['plain text only', clip([file('text/plain')], [item('string', file('text/plain'))])],
    ['an empty clipboard', clip([])],
    ['no clipboard data', null],
  ])('Given %s, when read, then it returns null', (_label, data) => {
    expect(imageFromClipboard(data), 'Then nothing should be picked').toBeNull();
  });
});

describe('isTextTarget', () => {
  const el = (match: boolean) => ({ closest: () => (match ? {} : null) }) as unknown as EventTarget;

  it.each([
    ['a text field', el(true), true],
    ['the page body', el(false), false],
    ['no target', null, false],
  ])('Given a paste into %s, when checked, then it is a text target: %s', (_label, target, expected) => {
    expect(isTextTarget(target), `Then it should be ${expected}`).toBe(expected);
  });
});
