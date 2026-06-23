import { useState } from 'react';

/**
 * The selectedId spine shared by every viz: a controlled value (`controlled`
 * set) wins; otherwise selection is tracked internally, seeded from `defaultId`.
 * `select` only mutates internal state when UNCONTROLLED, but ALWAYS fires
 * `onSelect` so a controlled parent sees the intent. Mirrors the inlined pattern
 * the @trembus/ui Tier-1 viz repeated per component — extracted here because viz
 * has two consumers (Tree now, Lineage next).
 */
export function useControllableSelection(
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
