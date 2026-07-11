import { TalentTree } from '@trembus/viz';
import type { TalentTreeContract, TalentTreeTone } from '@trembus/viz';
import { cx } from '../../internal/cx';
import './Constellation.css';

/** The Constellation consumes the same authored shape as the viz `TalentTree`. */
export type { TalentTreeContract as ConstellationContract } from '@trembus/viz';

/**
 * `Constellation` — the liturgical-gothic skin over the viz `TalentTree`. It frames the
 * talent DAG as a night star-chart: a reliquary-dark plate scattered with faint specks,
 * HUD corner brackets, a display-serif title, and an optional designation tab, and
 * re-tints the whole tree accent (met edges · budget meter · node tone · tier labels)
 * through the `--tcl-talenttree-accent` token hook — points of light you progressively
 * ignite. The interactive spine is the TalentTree's: real focusable talent buttons, the
 * full guarded allocation engine, and a live inspector. Theatrical surface, accessible
 * spine.
 *
 * Tone rides the plate's borders, tints, and the accent lever ONLY — never running text
 * (gold as text fails AA on a light surface; the Badge tone-as-text rule), so the skin
 * keeps its own chrome on `--tcl-text` / `--tcl-text-dim`.
 */
export type ConstellationTone = TalentTreeTone;

export interface ConstellationProps {
  /** The talent tree — the same shape as the viz `TalentTree`. */
  data: TalentTreeContract;
  /** Controlled allocation map: id → rank. */
  allocated?: Readonly<Record<string, number>>;
  defaultAllocated?: Readonly<Record<string, number>>;
  onAllocatedChange?: (next: Record<string, number>, change: { id: string; rank: number }) => void;
  /** Display a finished build (allocate/remove affordances hidden). */
  readOnly?: boolean;
  /** Selection trio (drives the inspector). */
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  /** Frame accent (met edges · meter · node default · tier labels). Default `accent`. */
  tone?: ConstellationTone;
  /** Top-left designation tab, e.g. "Reliquary Archive · Rites". */
  designation?: string;
  className?: string;
}

const CORNERS = ['tl', 'tr', 'bl', 'br'] as const;

export function Constellation({
  data,
  allocated,
  defaultAllocated,
  onAllocatedChange,
  readOnly,
  selectedId,
  defaultSelectedId,
  onSelect,
  tone = 'accent',
  designation,
  className,
}: ConstellationProps) {
  return (
    <div className={cx('tcl-constellation', className)} data-tone={tone}>
      <span className="tcl-constellation__field" aria-hidden="true" />
      {CORNERS.map((corner) => (
        <span
          key={corner}
          className="tcl-constellation__bracket"
          data-corner={corner}
          aria-hidden="true"
        />
      ))}
      {designation && <span className="tcl-constellation__designation">{designation}</span>}
      <TalentTree
        data={data}
        allocated={allocated}
        defaultAllocated={defaultAllocated}
        onAllocatedChange={onAllocatedChange}
        readOnly={readOnly}
        selectedId={selectedId}
        defaultSelectedId={defaultSelectedId}
        onSelect={onSelect}
        className="tcl-constellation__tree"
      />
    </div>
  );
}
