/** Pasting a photo: pull the first image out of a paste, and skip pastes meant for a text field. */

/** The first image file in a paste, or null when the clipboard holds no image. */
export function imageFromClipboard(data: Pick<DataTransfer, 'files' | 'items'> | null | undefined): File | null {
  if (!data) return null;
  for (const f of Array.from(data.files ?? [])) if (f.type.startsWith('image/')) return f;
  // Some browsers expose a copied image only as an item, not in `files`.
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  return null;
}

/** True when the paste lands in somewhere that takes text, so it must be left alone. */
export function isTextTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false;
  return (target as Element).closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !== null;
}
