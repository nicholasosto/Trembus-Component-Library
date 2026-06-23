import { useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import { toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './Treemap.css';

/**
 * `Treemap` — a space-filling chart that sizes each node's rectangle to its share
 * of the whole via a deterministic **squarified** layout (ported from the static
 * HTML PMO kit, so one authored contract draws in both places). The tiling is
 * computed in a fixed-aspect box; each cell is then an HTML `<button>` positioned
 * by percentage over that box (the LineChart overlay lesson) so selection stays
 * accessible — the Hub/BarChart interaction spine. Selecting a cell reveals its
 * value, share, and note in a live inspector.
 */
export type TreemapTone = FillBarTone;

export interface TreemapNode {
  /** Stable id for selection; falls back to the node index. */
  id?: string;
  /** Node label — shown in the cell when it is large enough. */
  label: string;
  /** Magnitude (non-negative); zero/negative nodes get no cell. */
  value: number;
  /** Color-coded tone (defaults cycle through the ontology by node order). */
  tone?: TreemapTone;
  /** Explicit cell color (hex) — overrides `tone`. */
  color?: string;
  /** Secondary label shown in the inspector. */
  sub?: string;
  /** Inspector detail shown when this node is selected. */
  note?: string;
}

export interface TreemapContract {
  view?: 'treemap';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  /** Unit suffix appended to every value label (e.g. `h`, `k`). */
  unit?: string;
  nodes: TreemapNode[];
}

export interface TreemapProps {
  data: TreemapContract;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

const TONE_CYCLE: TreemapTone[] = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'];

// The foreground token designed to sit on each solid tone (white in light theme,
// dark in dark theme) — keeps cell text legible without guessing contrast.
const TONE_FG: Record<TreemapTone, string> = {
  accent: 'var(--tcl-accent-fg)',
  info: 'var(--tcl-status-info-fg)',
  success: 'var(--tcl-status-success-fg)',
  warning: 'var(--tcl-status-warning-fg)',
  danger: 'var(--tcl-status-danger-fg)',
  neutral: 'var(--tcl-status-neutral-fg)',
};

/** Stable, collision-proof node key: explicit id, else the node index. */
const idOf = (n: TreemapNode, i: number): string => n.id ?? `s${i}`;
const toneOf = (n: TreemapNode, i: number): TreemapTone =>
  n.tone ?? TONE_CYCLE[i % TONE_CYCLE.length];
const fmt = (v: number, unit?: string): string => `${Math.round(v * 100) / 100}${unit ?? ''}`;

// Layout box. The container carries this exact aspect ratio so squarified cells
// render square and the percentage overlay aligns to the tiling.
const W = 600;
const H = 400;
/** A cell must be at least this big (in layout units) to show its label/value. */
const TEXT_W = 66;
const TEXT_H = 38;

interface Cell {
  id: string;
  i: number;
  node: TreemapNode;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Item {
  id: string;
  i: number;
  node: TreemapNode;
  area: number;
}

/**
 * Squarified treemap (Bruls/Huizing/van Wijk). Lays positive-area items into the
 * box, packing each row along the shorter remaining side to keep aspect ratios
 * near 1. Returns a rect per item in [0,W]×[0,H] layout space.
 */
function squarify(items: Item[]): Cell[] {
  const cells: Cell[] = [];
  let x = 0;
  let y = 0;
  let w = W;
  let h = H;
  let row: Item[] = [];
  const rest = items.slice();

  // Worst (largest) aspect ratio in a row laid along a strip of length `len`.
  const worst = (r: Item[], len: number): number => {
    const s = r.reduce((a, it) => a + it.area, 0);
    if (s <= 0 || len <= 0) return Infinity;
    const side = s / len;
    let max = 0;
    for (const it of r) {
      const other = it.area / side;
      if (other <= 0) return Infinity;
      max = Math.max(max, side / other, other / side);
    }
    return max;
  };

  const layoutRow = (r: Item[], len: number): void => {
    const s = r.reduce((a, it) => a + it.area, 0);
    const side = s / len; // strip thickness
    let off = 0;
    for (const it of r) {
      const other = side > 0 ? it.area / side : 0; // extent along the strip
      if (w >= h) cells.push({ ...it, x, y: y + off, w: side, h: other });
      else cells.push({ ...it, x: x + off, y, w: other, h: side });
      off += other;
    }
    if (w >= h) {
      x += side;
      w -= side;
    } else {
      y += side;
      h -= side;
    }
  };

  while (rest.length) {
    const len = Math.min(w, h);
    const n = rest.shift() as Item;
    if (!row.length) {
      row.push(n);
      continue;
    }
    if (worst([...row, n], len) <= worst(row, len)) {
      row.push(n);
    } else {
      layoutRow(row, len);
      row = [n];
    }
  }
  if (row.length) layoutRow(row, Math.min(w, h));
  return cells;
}

export function Treemap({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: TreemapProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultSelectedId);
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelect?.(id);
  };

  const { nodes, unit } = data;

  // Positive-area items only (keeping their ORIGINAL index for stable ids), then
  // the squarified rects. Total drives both areas and the share percentages.
  const { cells, total } = useMemo(() => {
    const positive = nodes
      .map((node, i) => ({ node, i }))
      .filter(({ node }) => Number.isFinite(node.value) && node.value > 0);
    const sum = positive.reduce((a, { node }) => a + node.value, 0);
    if (sum <= 0) return { cells: [] as Cell[], total: 0 };
    const items: Item[] = positive.map(({ node, i }) => ({
      id: idOf(node, i),
      i,
      node,
      area: (node.value / sum) * W * H,
    }));
    return { cells: squarify(items), total: sum };
  }, [nodes]);

  const pct = (v: number): number => (total > 0 ? Math.round((100 * v) / total) : 0);
  const selected = cells.find((c) => c.id === selectedId)?.node;

  return (
    <div className={cx('tcl-treemap', className)}>
      {(data.code || data.title || data.caption || data.brand) && (
        <header className="tcl-treemap__header">
          {data.brand && <p className="tcl-treemap__brand">{data.brand}</p>}
          {data.code && <p className="tcl-treemap__code">{data.code}</p>}
          {data.title && <p className="tcl-treemap__title">{data.title}</p>}
          {data.caption && <p className="tcl-treemap__caption">{data.caption}</p>}
        </header>
      )}

      <div
        className="tcl-treemap__plot"
        role="group"
        aria-label={data.title ?? 'Treemap'}
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        {cells.length === 0 ? (
          <p className="tcl-treemap__empty">No data in range</p>
        ) : (
          cells.map((c) => {
            const isSelected = c.id === selectedId;
            // Clamp to the box so float drift can't push a cell past the edge.
            const left = (c.x / W) * 100;
            const top = (c.y / H) * 100;
            const width = (Math.min(c.w, W - c.x) / W) * 100;
            const height = (Math.min(c.h, H - c.y) / H) * 100;
            const showText = c.w >= TEXT_W && c.h >= TEXT_H;
            const tone = toneOf(c.node, c.i);
            // Custom hex colours can't map to a tone fg → fall back to the themed
            // text colour (the bg halo in CSS keeps it readable).
            const fg = c.node.color ? 'var(--tcl-text)' : TONE_FG[tone];
            return (
              <button
                key={c.id}
                type="button"
                className={cx('tcl-treemap__cell', isSelected && 'is-selected')}
                style={vars({
                  '--cell': c.node.color ?? toneVar(tone),
                  '--cell-fg': fg,
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                })}
                aria-pressed={isSelected}
                aria-label={`${c.node.label}: ${fmt(c.node.value, unit)}, ${pct(c.node.value)}% of total`}
                onClick={() => select(c.id)}
              >
                {showText && (
                  <span className="tcl-treemap__cell-text">
                    <span className="tcl-treemap__cell-label">{c.node.label}</span>
                    <span className="tcl-treemap__cell-value">{fmt(c.node.value, unit)}</span>
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="tcl-treemap__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-treemap__inspector-title">
              {selected.label}
              {selected.sub && (
                <span className="tcl-treemap__inspector-sub"> · {selected.sub}</span>
              )}
              <span className="tcl-treemap__inspector-value">
                {' · '}
                {fmt(selected.value, unit)} · {pct(selected.value)}%
              </span>
            </p>
            {selected.note && <p className="tcl-treemap__inspector-note">{selected.note}</p>}
          </>
        ) : (
          <p className="tcl-treemap__inspector-hint">Select a cell to inspect its share.</p>
        )}
      </div>
    </div>
  );
}
