import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, KeyboardEvent, ReactElement, ReactNode, UIEvent } from 'react';
import { cx } from '../../utils/cx';
import { isDev } from '../../utils/env';
import './VirtualAssetGrid.css';

export interface VirtualAssetGridProps<T> {
  /** The full flat dataset; the grid windows it (safe at 10k+). Keep this a STABLE reference. */
  items: T[];
  /**
   * REQUIRED stable key per item → React key, ref map, roving index, aria id, selection id.
   * Never falls back to label/index (duplicate labels would collide into one option).
   */
  getKey: (item: T) => string;
  /** Render the tile body; `state.selected` drives the selected styling. Memoized on (item, selected). */
  renderTile: (item: T, state: { selected: boolean }) => ReactNode;
  /** Accessible name for the option (aria-label + live inspector). Defaults to `getKey(item)`. */
  getLabel?: (item: T) => string;

  // ── sectioning ──
  /** Group items into sections; omit → a single unsubheaded grid. */
  groupBy?: (item: T) => string;
  /** Human label for a group key (default: the key). */
  groupLabel?: (key: string) => ReactNode;
  /** Explicit section order; unlisted keys append in first-seen order; empty sections skipped. */
  groupOrder?: string[];

  // ── layout / windowing ──
  /** Min tile width (px) → responsive column count. Default 200. */
  minTileWidth?: number;
  /** Fixed tile height (px). Else derived from `minTileWidth * aspect`. */
  tileHeight?: number;
  /** Tile aspect (h/w) when `tileHeight` is omitted. Default 1 (square). */
  aspect?: number;
  /** Gap between tiles/rows (px). Default 12. */
  gap?: number;
  /** Overscan rows above & below the viewport. Default 3. */
  overscanRows?: number;
  /** Escape hatch: render every tile (tests / print / tiny sets / axe over the full tree). Default true. */
  virtualize?: boolean;

  // ── single selection (controlled / uncontrolled) ──
  /** Controlled selected tile id (a `getKey` value). */
  selectedId?: string;
  /** Initial selection for uncontrolled use. */
  defaultSelectedId?: string;
  /** Called with the tile id + item on click or Enter/Space. */
  onSelect?: (id: string, item: T) => void;

  // ── misc ──
  /** listbox accessible name. Default 'Assets'. */
  label?: string;
  /** Shown when `items.length === 0`. Default 'No assets.'. */
  emptyState?: ReactNode;
  className?: string;
}

// Fixed border-box subhead height (px). Mirrored to CSS via the --tcl-vag-sh custom
// property so the windowing model and the real DOM flow are equal by construction.
const SUBHEAD_H = 34;

interface Section<T> {
  key: string;
  items: T[];
  count: number;
  firstFlatIndex: number;
}
interface GeoSection<T> extends Section<T> {
  rows: number;
  top: number;
  tilesTop: number;
  tilesHeight: number;
  subheadId: string;
}

/** Bucket items into ordered, non-empty sections (groupOrder first, then first-seen). */
function buildSections<T>(
  items: T[],
  groupBy: ((item: T) => string) | undefined,
  groupOrder: string[] | undefined,
): Section<T>[] {
  if (!groupBy) {
    return [{ key: '__all__', items, count: items.length, firstFlatIndex: 0 }];
  }
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = groupBy(it);
    const arr = map.get(k);
    if (arr) arr.push(it);
    else map.set(k, [it]);
  }
  const ordered: string[] = [];
  const seen = new Set<string>();
  if (groupOrder) {
    for (const k of groupOrder) {
      if (map.has(k) && !seen.has(k)) {
        ordered.push(k);
        seen.add(k);
      }
    }
  }
  for (const k of map.keys()) {
    if (!seen.has(k)) {
      ordered.push(k);
      seen.add(k);
    }
  }
  let flat = 0;
  return ordered.map((key) => {
    const arr = map.get(key)!;
    const sec: Section<T> = { key, items: arr, count: arr.length, firstFlatIndex: flat };
    flat += arr.length;
    return sec;
  });
}

/** ResizeObserver-backed content-box size of an element (SSR-safe, browser-frame-throttled). */
function useElementSize(): readonly [
  (node: HTMLElement | null) => void,
  { width: number; height: number },
] {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const roRef = useRef<ResizeObserver | null>(null);

  const apply = useCallback((width: number, height: number) => {
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      roRef.current?.disconnect();
      roRef.current = null;
      if (!node) return;
      // Seed from the content box (clientWidth excludes border + scrollbar) so the
      // synchronous seed agrees with the ResizeObserver's contentRect — no off-by-one.
      apply(node.clientWidth, node.clientHeight);
      if (typeof ResizeObserver === 'undefined') return;
      // ResizeObserver is already coalesced to ≤ once per frame by the browser.
      const ro = new ResizeObserver((entries) => {
        const e = entries[entries.length - 1];
        if (e) apply(e.contentRect.width, e.contentRect.height);
      });
      ro.observe(node);
      roRef.current = ro;
    },
    [apply],
  );

  useEffect(() => () => roRef.current?.disconnect(), []);
  return [setRef, size] as const;
}

interface TileProps<T> {
  item: T;
  renderTile: (item: T, state: { selected: boolean }) => ReactNode;
  selected: boolean;
  id: string;
  x: number;
  y: number;
  tabbable: boolean;
  posinset: number;
  setsize: number;
  label: string;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  onClick: (id: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, id: string) => void;
}

function TileImpl<T>({
  item,
  renderTile,
  selected,
  id,
  x,
  y,
  tabbable,
  posinset,
  setsize,
  label,
  registerRef,
  onClick,
  onKeyDown,
}: TileProps<T>): ReactElement {
  return (
    <div
      ref={(el) => registerRef(id, el)}
      role="option"
      aria-selected={selected}
      aria-posinset={posinset}
      aria-setsize={setsize}
      aria-label={label}
      tabIndex={tabbable ? 0 : -1}
      data-state={selected ? 'selected' : undefined}
      className="tcl-virtual-asset-grid__tile"
      style={{ transform: `translate(${x}px, ${y}px)` }}
      onClick={() => onClick(id)}
      onKeyDown={(e) => onKeyDown(e, id)}
    >
      {renderTile(item, { selected })}
    </div>
  );
}
// memo so scrolling never re-runs `renderTile` for tiles whose props are unchanged.
const Tile = memo(TileImpl) as typeof TileImpl;

/**
 * `VirtualAssetGrid` — a windowed, responsive, sectioned single-select tile grid.
 * Lead job **Reveal State**: renders only the visible tiles of a large dataset with
 * sticky counted section subheads and a selection tint. It **Affords Action** as a
 * `role=listbox` of focusable `role=option` tiles, and **Acknowledges Input** with
 * 2D roving-tabindex arrow navigation (moving by the live column count, across
 * section boundaries) plus an `aria-live` inspector — selecting a windowed-out tile
 * scrolls it into view, mounts it, and focuses it.
 */
export function VirtualAssetGrid<T>({
  items,
  getKey,
  renderTile,
  getLabel,
  groupBy,
  groupLabel,
  groupOrder,
  minTileWidth = 200,
  tileHeight,
  aspect = 1,
  gap = 12,
  overscanRows = 3,
  virtualize = true,
  selectedId,
  defaultSelectedId,
  onSelect,
  label = 'Assets',
  emptyState,
  className,
}: VirtualAssetGridProps<T>): ReactElement {
  const baseId = useId();
  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const rowEls = useRef(new Map<string, HTMLDivElement>());
  const pendingFocusRef = useRef<string | null>(null);

  const [measureRef, size] = useElementSize();
  const setScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollElRef.current = node;
      measureRef(node);
    },
    [measureRef],
  );

  const [scrollTop, setScrollTop] = useState(0);
  const scrollTopRef = useRef(0);
  const scrollRaf = useRef<number | null>(null);
  const [focusId, setFocusId] = useState<string | undefined>(defaultSelectedId ?? selectedId);
  const [liveMessage, setLiveMessage] = useState('');

  // ── selection (controlled / uncontrolled) ──
  const selControlled = selectedId !== undefined;
  const [selInternal, setSelInternal] = useState<string | undefined>(defaultSelectedId);
  const selected = selControlled ? selectedId : selInternal;

  const itemById = useMemo(() => {
    const m = new Map<string, T>();
    for (const it of items) {
      const k = getKey(it);
      if (isDev && m.has(k)) {
        console.warn(`[VirtualAssetGrid] duplicate getKey "${k}" — keys must be unique per item.`);
      }
      m.set(k, it);
    }
    return m;
  }, [items, getKey]);

  const showSubheads = !!groupBy;
  const sections = useMemo(
    () => buildSections(items, groupBy, groupOrder),
    [items, groupBy, groupOrder],
  );
  const flatItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const flatIndex = useMemo(() => {
    const m = new Map<string, number>();
    flatItems.forEach((it, i) => m.set(getKey(it), i));
    return m;
  }, [flatItems, getKey]);

  // ── layout math ──
  const cols = Math.max(1, Math.floor((size.width + gap) / (minTileWidth + gap)));
  const tileW = size.width > 0 ? (size.width - (cols - 1) * gap) / cols : minTileWidth;
  const tileH = Math.max(1, tileHeight ?? Math.round(minTileWidth * aspect));
  const rowStride = Math.max(1, tileH + gap); // never 0 → no divide-by-zero in visibleRange
  // Subheads are a FIXED border-box height (SUBHEAD_H, mirrored to CSS via --tcl-vag-sh),
  // so the windowing model provably matches the real CSS-flow DOM for every section —
  // no per-section measurement and no drift from a tall or multi-line group label.
  const subheadH = showSubheads ? SUBHEAD_H : 0;

  const geometry = useMemo(() => {
    let top = 0;
    const secs: GeoSection<T>[] = sections.map((s, i) => {
      const rows = Math.max(1, Math.ceil(s.count / cols));
      const tilesHeight = rows * tileH + Math.max(0, rows - 1) * gap;
      const g: GeoSection<T> = {
        ...s,
        rows,
        top,
        tilesTop: top + (showSubheads ? subheadH : 0),
        tilesHeight,
        subheadId: `${baseId}-s${i}`,
      };
      top += (showSubheads ? subheadH : 0) + tilesHeight;
      return g;
    });
    return { secs, totalHeight: top };
  }, [sections, cols, tileH, gap, subheadH, showSubheads, baseId]);

  const sectionAt = useCallback(
    (idx: number): { sec: GeoSection<T>; i: number } | null => {
      const secs = geometry.secs;
      for (let i = 0; i < secs.length; i++) {
        const s = secs[i];
        if (idx >= s.firstFlatIndex && idx < s.firstFlatIndex + s.count) return { sec: s, i };
      }
      return null;
    },
    [geometry],
  );

  // ── scroll → windowing (rAF-throttled) ──
  const onScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const st = e.currentTarget.scrollTop;
    scrollTopRef.current = st;
    if (scrollRaf.current != null) return;
    scrollRaf.current =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(() => {
            scrollRaf.current = null;
            setScrollTop((prev) => (prev === scrollTopRef.current ? prev : scrollTopRef.current));
          })
        : null;
    if (scrollRaf.current == null) setScrollTop((prev) => (prev === st ? prev : st));
  }, []);
  useEffect(
    () => () => {
      if (scrollRaf.current != null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(scrollRaf.current);
      }
    },
    [],
  );

  // ── focus management ──
  const tabbableId =
    (focusId && flatIndex.has(focusId) ? focusId : undefined) ??
    (selected && flatIndex.has(selected) ? selected : undefined) ??
    (flatItems[0] ? getKey(flatItems[0]) : undefined);

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) rowEls.current.set(id, el);
    else rowEls.current.delete(id);
  }, []);

  const moveFocus = useCallback(
    (id: string) => {
      setFocusId(id);
      pendingFocusRef.current = id;
      const idx = flatIndex.get(id);
      if (idx == null) return;
      const found = sectionAt(idx);
      const el = scrollElRef.current;
      if (!found || !el) return;
      const localRow = Math.floor((idx - found.sec.firstFlatIndex) / cols);
      const targetTop = found.sec.tilesTop + localRow * rowStride;
      const targetBottom = targetTop + tileH;
      const vh = el.clientHeight;
      const cur = el.scrollTop;
      let next = cur;
      if (targetTop < cur + (showSubheads ? subheadH : 0)) {
        next = Math.max(0, targetTop - (showSubheads ? subheadH : 0) - gap);
      } else if (targetBottom > cur + vh) {
        next = targetBottom - vh + gap;
      }
      if (next !== cur) {
        el.scrollTop = next; // instant, so focus-after-mount ordering holds
        scrollTopRef.current = next;
        setScrollTop(next); // mount the target row in the same commit
      }
    },
    [flatIndex, sectionAt, cols, rowStride, tileH, subheadH, gap, showSubheads],
  );

  // After a focus request, focus the (now-mounted) tile; retry once the windowing commit lands.
  useLayoutEffect(() => {
    const id = pendingFocusRef.current;
    if (!id) return;
    const el = rowEls.current.get(id);
    if (el) {
      if (document.activeElement !== el) el.focus();
      pendingFocusRef.current = null;
    }
  }, [focusId, scrollTop]);

  // Re-home a stale focusId (its tile left the data) — but never steal focus from outside the grid.
  useEffect(() => {
    if (!focusId || flatIndex.has(focusId)) return;
    const active = document.activeElement;
    if ((!active || active === document.body) && tabbableId) {
      // Route through moveFocus so the fallback tile is scrolled into view + mounted
      // before focus lands — a raw focus() no-ops when the fallback is windowed out.
      moveFocus(tabbableId);
    }
  }, [focusId, flatIndex, tabbableId, moveFocus]);

  // ── selection ──
  const select = useCallback(
    (id: string) => {
      if (!selControlled) setSelInternal(id);
      const item = itemById.get(id);
      if (item !== undefined) onSelect?.(id, item);
      const idx = flatIndex.get(id);
      const found = idx == null ? null : sectionAt(idx);
      const name = item !== undefined && getLabel ? getLabel(item) : id;
      if (found) {
        const pos = idx! - found.sec.firstFlatIndex + 1;
        const where = showSubheads ? ` in ${found.sec.key}` : '';
        setLiveMessage(`${name} selected, ${pos} of ${found.sec.count}${where}`);
      } else {
        setLiveMessage(`${name} selected`);
      }
    },
    [selControlled, itemById, onSelect, flatIndex, sectionAt, getLabel, showSubheads],
  );

  const handleClick = useCallback(
    (id: string) => {
      moveFocus(id);
      select(id);
    },
    [moveFocus, select],
  );

  // ── 2D roving keyboard nav ──
  const onTileKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, id: string) => {
      const len = flatItems.length;
      if (len === 0) return;
      const idx = flatIndex.get(id);
      if (idx == null) return;

      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        select(id);
        return;
      }

      const found = sectionAt(idx);
      if (!found) return;
      const { sec, i: si } = found;
      const local = idx - sec.firstFlatIndex;
      const col = local % cols;
      let target = idx;

      switch (e.key) {
        case 'ArrowRight':
          target = Math.min(idx + 1, len - 1);
          break;
        case 'ArrowLeft':
          target = Math.max(idx - 1, 0);
          break;
        case 'Home':
          target = 0;
          break;
        case 'End':
          target = len - 1;
          break;
        case 'PageDown': {
          const vr = Math.max(1, Math.floor(size.height / rowStride));
          target = Math.min(idx + vr * cols, len - 1);
          break;
        }
        case 'PageUp': {
          const vr = Math.max(1, Math.floor(size.height / rowStride));
          target = Math.max(idx - vr * cols, 0);
          break;
        }
        case 'ArrowDown': {
          const down = local + cols;
          if (down < sec.count) {
            target = sec.firstFlatIndex + down; // same section, straight down
          } else if (Math.floor(local / cols) < sec.rows - 1) {
            target = sec.firstFlatIndex + sec.count - 1; // partial last row: clamp within section
          } else {
            const next = geometry.secs[si + 1]; // cross into next section, same column
            if (next) {
              const filled = Math.min(cols, next.count);
              target = next.firstFlatIndex + Math.min(col, filled - 1);
            }
          }
          break;
        }
        case 'ArrowUp': {
          const up = local - cols;
          if (up >= 0) {
            target = sec.firstFlatIndex + up; // same section, straight up
          } else {
            const prev = geometry.secs[si - 1]; // cross into prev section's last row, same column
            if (prev) {
              const lastRowStart = (prev.rows - 1) * cols;
              const lastFilled = prev.count - lastRowStart;
              target = prev.firstFlatIndex + lastRowStart + Math.min(col, lastFilled - 1);
            }
          }
          break;
        }
        default:
          return;
      }

      e.preventDefault();
      if (target !== idx) moveFocus(getKey(flatItems[target]));
    },
    [
      flatItems,
      flatIndex,
      sectionAt,
      geometry,
      cols,
      size.height,
      rowStride,
      moveFocus,
      select,
      getKey,
    ],
  );

  // ── windowing: visible local range per section ──
  const vpTop = scrollTop - overscanRows * rowStride;
  const vpBottom = scrollTop + size.height + overscanRows * rowStride;
  const visibleRange = (sec: GeoSection<T>): { start: number; end: number } => {
    if (!virtualize) return { start: 0, end: sec.count };
    const top = sec.tilesTop;
    const bottom = sec.tilesTop + sec.tilesHeight;
    if (bottom < vpTop || top > vpBottom) return { start: 0, end: 0 };
    const firstRow = Math.max(0, Math.floor((vpTop - top) / rowStride));
    const lastRow = Math.min(sec.rows - 1, Math.floor((vpBottom - top) / rowStride));
    return { start: Math.max(0, firstRow * cols), end: Math.min(sec.count, (lastRow + 1) * cols) };
  };

  const tabbableIdx = tabbableId != null ? flatIndex.get(tabbableId) : undefined;

  const renderTiles = (sec: GeoSection<T>): ReactElement[] => {
    const { start, end } = visibleRange(sec);
    const buildTile = (local: number): ReactElement => {
      const item = sec.items[local];
      const id = getKey(item);
      return (
        <Tile
          key={id}
          item={item}
          renderTile={renderTile}
          selected={selected === id}
          id={id}
          x={(local % cols) * (tileW + gap)}
          y={Math.floor(local / cols) * rowStride}
          tabbable={id === tabbableId}
          posinset={local + 1}
          setsize={sec.count}
          label={getLabel?.(item) ?? id}
          registerRef={registerRef}
          onClick={handleClick}
          onKeyDown={onTileKeyDown}
        />
      );
    };
    const out: ReactElement[] = [];
    for (let local = start; local < end; local++) out.push(buildTile(local));
    // Keyboard reachability: the single tabbable tile must ALWAYS be mounted — even
    // when windowed out — or there is no tabindex=0 anchor to Tab into the grid.
    if (tabbableIdx != null) {
      const anchor = tabbableIdx - sec.firstFlatIndex;
      if (anchor >= 0 && anchor < sec.count && (anchor < start || anchor >= end)) {
        out.push(buildTile(anchor));
      }
    }
    return out;
  };

  if (items.length === 0) {
    return (
      <div className={cx('tcl-virtual-asset-grid', className)}>
        <div className="tcl-virtual-asset-grid__empty">{emptyState ?? 'No assets.'}</div>
      </div>
    );
  }

  const scrollerStyle = {
    '--tcl-vag-tw': `${tileW}px`,
    '--tcl-vag-th': `${tileH}px`,
    '--tcl-vag-sh': `${SUBHEAD_H}px`,
  } as CSSProperties;

  return (
    <div className={cx('tcl-virtual-asset-grid', className)}>
      <span className="tcl-sr-only" role="status" aria-live="polite">
        {liveMessage}
      </span>
      <div
        ref={setScrollRef}
        role="listbox"
        aria-label={label}
        aria-multiselectable={false}
        className="tcl-virtual-asset-grid__scroller"
        style={scrollerStyle}
        onScroll={onScroll}
      >
        {size.width > 0 &&
          geometry.secs.map((sec) => {
            const canvas = (
              <div
                role="presentation"
                className="tcl-virtual-asset-grid__canvas"
                style={{ height: sec.tilesHeight }}
              >
                {renderTiles(sec)}
              </div>
            );
            if (!showSubheads) {
              return <Fragment key={sec.key}>{canvas}</Fragment>;
            }
            return (
              <div
                key={sec.key}
                role="group"
                aria-labelledby={`${sec.subheadId} ${sec.subheadId}-c`}
                className="tcl-virtual-asset-grid__section"
              >
                <div className="tcl-virtual-asset-grid__subhead">
                  <span id={sec.subheadId} className="tcl-virtual-asset-grid__subhead-label">
                    {groupLabel ? groupLabel(sec.key) : sec.key}
                  </span>
                  <span id={`${sec.subheadId}-c`} className="tcl-virtual-asset-grid__subhead-count">
                    {sec.count}
                  </span>
                </div>
                {canvas}
              </div>
            );
          })}
      </div>
    </div>
  );
}
