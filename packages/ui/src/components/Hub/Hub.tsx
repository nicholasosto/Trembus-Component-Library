import { useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import './Hub.css';

/**
 * `Hub` — a hex-flower overview (one reserved center + up to six domain petals).
 *
 * It consumes the Trembus Visual Grammar **hub contract** — the same JSON shape
 * as `canonical/kits/visual-grammar/schema/hub.schema.json`. So a `hub.example.json`
 * authored for the static HTML kit renders here unchanged. Geometry is the kit's
 * flat-top "6 around 1" flower, computed from a single `size`.
 */
export type HubDomainKind = 'center' | 'shipped' | 'current' | 'planned';
export type HubSlot = 'center' | 'n' | 'ne' | 'se' | 's' | 'sw' | 'nw';
export type HubSource = string | { label: string; href?: string };

export interface HubDomain {
  id: string;
  /** Hex slot — legacy VG names (hub/robot/blood/decay/spirit/fate/shared),
   *  generic slots (center/n/ne/se/s/sw/nw), or omit to auto-place by order. */
  pos?: string;
  kind: HubDomainKind;
  tag: string;
  name: string;
  sub: string;
  status: string;
  /** Accent dot color (hex). */
  dot?: string;
  /** Inspector detail shown when the tile is selected. */
  note?: string;
  sources?: HubSource[];
}

export interface HubStat {
  label: string;
  value: string | number;
  color?: string;
}

export interface HubContract {
  view?: 'hub';
  brand?: string;
  code?: string;
  tagline?: string;
  taglineNote?: string;
  /** Tagline pill color (hex). */
  tone?: string;
  sub?: string;
  axis?: string;
  stats?: HubStat[];
  domains: HubDomain[];
}

export interface HubProps {
  data: HubContract;
  /** Controlled selected domain id. */
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  /** Hex tile width in px (height derives as ~0.866×). */
  size?: number;
  className?: string;
}

const SLOT_OF: Record<string, HubSlot> = {
  hub: 'center',
  center: 'center',
  robot: 'n',
  n: 'n',
  top: 'n',
  north: 'n',
  blood: 'ne',
  ne: 'ne',
  decay: 'se',
  se: 'se',
  spirit: 's',
  s: 's',
  bottom: 's',
  south: 's',
  fate: 'sw',
  sw: 'sw',
  shared: 'nw',
  nw: 'nw',
};

const RING_ORDER: HubSlot[] = ['n', 'ne', 'se', 's', 'sw', 'nw'];

function resolveSlots(domains: HubDomain[]): Map<string, HubSlot> {
  const used = new Set<HubSlot>();
  const result = new Map<string, HubSlot>();

  // Pass 1 — honor explicit pos / center kind.
  for (const d of domains) {
    const explicit = d.pos
      ? SLOT_OF[d.pos.toLowerCase()]
      : d.kind === 'center'
        ? 'center'
        : undefined;
    if (explicit && !used.has(explicit)) {
      result.set(d.id, explicit);
      used.add(explicit);
    }
  }
  // Pass 2 — auto-place the rest into free ring slots, in order.
  const ring = RING_ORDER.filter((s) => !used.has(s));
  for (const d of domains) {
    if (result.has(d.id)) continue;
    if (d.kind === 'center' && !used.has('center')) {
      result.set(d.id, 'center');
      used.add('center');
      continue;
    }
    const slot = ring.shift();
    if (slot) {
      result.set(d.id, slot);
      used.add(slot);
    }
  }
  return result;
}

function slotXY(slot: HubSlot, w: number, h: number): { x: number; y: number } {
  switch (slot) {
    case 'n':
      return { x: 0, y: -h };
    case 's':
      return { x: 0, y: h };
    case 'ne':
      return { x: 0.75 * w, y: -h / 2 };
    case 'se':
      return { x: 0.75 * w, y: h / 2 };
    case 'nw':
      return { x: -0.75 * w, y: -h / 2 };
    case 'sw':
      return { x: -0.75 * w, y: h / 2 };
    case 'center':
    default:
      return { x: 0, y: 0 };
  }
}

export function Hub({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  size = 200,
  className,
}: HubProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultSelectedId);
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelect?.(id);
  };

  const w = size;
  const h = Math.round(size * 0.866);
  const containerW = 2.5 * w;
  const containerH = 3 * h;
  const centerX = 1.25 * w;
  const centerY = 1.5 * h;

  const slots = useMemo(() => resolveSlots(data.domains), [data.domains]);
  const selected = data.domains.find((d) => d.id === selectedId);

  return (
    <div className={cx('tcl-hub', className)}>
      <header className="tcl-hub__header">
        {data.brand && <p className="tcl-hub__brand">{data.brand}</p>}
        {data.code && <p className="tcl-hub__code">{data.code}</p>}
        {(data.tagline || data.taglineNote) && (
          <div className="tcl-hub__tagrow">
            {data.tagline && (
              <span
                className="tcl-hub__pill"
                style={data.tone ? { borderColor: data.tone, color: data.tone } : undefined}
              >
                {data.tagline}
              </span>
            )}
            {data.taglineNote && <span className="tcl-hub__tagnote">{data.taglineNote}</span>}
          </div>
        )}
        {data.sub && <p className="tcl-hub__sub">{data.sub}</p>}
        {data.stats && data.stats.length > 0 && (
          <div className="tcl-hub__stats">
            {data.stats.map((s, i) => (
              <div key={i} className="tcl-hub__stat">
                <span className="tcl-hub__stat-value" style={s.color ? { color: s.color } : undefined}>
                  {s.value}
                </span>
                <span className="tcl-hub__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </header>

      <div
        className="tcl-hub__flower"
        role="group"
        aria-label={data.tagline ?? data.brand ?? 'Domain map'}
        style={{ width: containerW, height: containerH }}
      >
        {data.domains.map((d) => {
          const slot = slots.get(d.id);
          if (!slot) return null;
          const { x, y } = slotXY(slot, w, h);
          const isSelected = d.id === selectedId;
          return (
            <button
              key={d.id}
              type="button"
              className={cx('tcl-hub__tile', `tcl-hub__tile--${d.kind}`, isSelected && 'is-selected')}
              style={{ left: centerX + x - w / 2, top: centerY + y - h / 2, width: w, height: h }}
              aria-pressed={isSelected}
              aria-label={`${d.name}, ${d.tag}, ${d.status}`}
              onClick={() => select(d.id)}
            >
              <span className="tcl-hub__dot" style={d.dot ? { color: d.dot } : undefined} aria-hidden="true" />
              <span className="tcl-hub__tag">{d.tag}</span>
              <span className="tcl-hub__name">{d.name}</span>
              <span className="tcl-hub__tile-sub">{d.sub}</span>
              <span className="tcl-hub__status">{d.status}</span>
            </button>
          );
        })}
      </div>

      <div className="tcl-hub__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-hub__inspector-title">
              {selected.name}
              <span className="tcl-hub__inspector-status"> · {selected.status}</span>
            </p>
            {selected.note && <p className="tcl-hub__inspector-note">{selected.note}</p>}
            {selected.sources && selected.sources.length > 0 && (
              <ul className="tcl-hub__sources">
                {selected.sources.map((s, i) => (
                  <li key={i}>{typeof s === 'string' ? s : s.label}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="tcl-hub__inspector-hint">Select a domain to inspect its detail.</p>
        )}
      </div>

      {data.axis && <p className="tcl-hub__axis">{data.axis}</p>}
    </div>
  );
}
