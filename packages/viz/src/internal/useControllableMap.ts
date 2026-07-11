import { useMemo, useState } from 'react';

/** Positive entries only (rank 0 = absent), so a rank has a single representation. */
function toMap(rec: Readonly<Record<string, number>> | undefined): Map<string, number> {
  const m = new Map<string, number>();
  if (rec) {
    for (const [k, v] of Object.entries(rec)) {
      if (typeof v === 'number' && v > 0) m.set(k, v);
    }
  }
  return m;
}

/** Content digest of the positive entries — stable across array/object identity churn. */
function digest(rec: Readonly<Record<string, number>>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(rec)) {
    if (typeof v === 'number' && v > 0) parts.push(`${k}:${v}`);
  }
  return parts.sort().join(' ');
}

/** The current map plus one change, as a plain record (rank <= 0 deletes the key). */
function toRecord(
  map: ReadonlyMap<string, number>,
  id: string,
  rank: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of map) out[k] = v;
  if (rank > 0) out[id] = rank;
  else delete out[id];
  return out;
}

/**
 * The rank-map twin of {@link useControllableSelection} / {@link useControllableSet}
 * — a controllable `Record<id, number>` (e.g. talent-tree allocations). A controlled
 * record wins; otherwise the map is tracked internally, seeded from `defaultMap`.
 * `commit(id, rank)` sets the id's rank (deleting it at `rank <= 0`, so rank 0 has a
 * single representation — absent), only mutating internal state when UNCONTROLLED, and
 * ALWAYS fires `onChange(nextRecord, { id, rank })` so a controlled parent sees the
 * intent. Domain-dumb: it clamps nothing and enforces no rules — the consumer's derive
 * layer owns clamping and legality.
 */
export function useControllableMap(
  controlled: Readonly<Record<string, number>> | undefined,
  defaultMap: Readonly<Record<string, number>> | undefined,
  onChange?: (next: Record<string, number>, change: { id: string; rank: number }) => void,
): readonly [ReadonlyMap<string, number>, (id: string, rank: number) => void] {
  const [internal, setInternal] = useState<Map<string, number>>(() => toMap(defaultMap));

  // In controlled mode, derive the Map with a STABLE identity across renders that
  // don't change the entries — a fresh Map every render would bust downstream
  // derive/layout memos that key on it (the controlled-allocation footgun).
  const controlledKey = controlled ? digest(controlled) : null;
  const controlledMap = useMemo(
    () => (controlled ? toMap(controlled) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the entries' content digest, not object identity
    [controlledKey],
  );
  const map = controlledMap ?? internal;

  const commit = (id: string, rank: number): void => {
    if (controlled === undefined) {
      setInternal((prev) => {
        const next = new Map(prev);
        if (rank > 0) next.set(id, rank);
        else next.delete(id);
        return next;
      });
    }
    onChange?.(toRecord(map, id, rank), { id, rank });
  };

  return [map, commit] as const;
}
