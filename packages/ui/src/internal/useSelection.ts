import { useState } from 'react';

/**
 * The selectedId spine shared by the Tier-1 viz: a controlled value wins;
 * otherwise selection is tracked internally, seeded from `defaultId`. `select`
 * only mutates internal state when UNCONTROLLED, but ALWAYS fires `onSelect` so
 * a controlled parent sees the intent.
 *
 * A deliberate sibling of `@trembus/viz`'s `useControllableSelection` — the same
 * five lines, copied rather than shared so neither package gains a dependency on
 * the other (the `cx` / `vars` precedent). Keep the two in sync.
 *
 * NOT adopted by three components whose selection genuinely differs — don't
 * "fix" them: `DecisionMap` seeds its initial state lazily from the data
 * (`decided` > `recommended`), and `FolderTree` / `VirtualAssetGrid` pair
 * selection with a separate roving-focus id.
 */
export function useSelection(
  controlled: string | undefined,
  defaultId: string | undefined,
  onSelect?: (id: string) => void,
): readonly [string | undefined, (id: string) => void] {
  const [internal, setInternal] = useState<string | undefined>(defaultId);
  const selectedId = controlled ?? internal;
  const select = (id: string): void => {
    if (controlled === undefined) setInternal(id);
    onSelect?.(id);
  };
  return [selectedId, select] as const;
}
