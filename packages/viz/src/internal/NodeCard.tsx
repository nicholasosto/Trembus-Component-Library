import type { ReactNode } from 'react';
import { cx } from './cx';
import { vars } from './vars';
import { toneVar } from './tone';
import type { VizTone } from './tone';
import './NodeCard.css';

export type NodeCardPortDirection = 'provided' | 'required';

export interface NodeCardPort {
  id: string;
  label: string;
  direction: NodeCardPortDirection;
  tone?: VizTone;
}

export interface NodeCardProps {
  /** Primary name — the box text. */
  label: string;
  /** Secondary label (tech / detail). */
  sub?: string;
  /** Small UML-style stereotype above the label, e.g. `«container»`. */
  stereotype?: string;
  /** Leading glyph (a kind/type icon) shown before the label. Decorative. */
  icon?: ReactNode;
  tone?: VizTone;
  /** Explicit color (hex) — overrides `tone`. */
  color?: string;
  /** A `container` reads as an openable boundary; a `leaf` is a terminal node. */
  variant?: 'leaf' | 'container';
  /** Information-scent text on a drill target, e.g. `5 components`. */
  badge?: string;
  /** Provided / required interfaces shown on the node and named in the SR name. */
  ports?: NodeCardPort[];
  /** Selected (rings + aria-pressed). */
  selected?: boolean;
  /** On the current selection's related set (emphasis ring, no dimming of others). */
  emphasized?: boolean;
  /** Has at least one connection that leaves the current level. */
  external?: boolean;
  /** Full accessible name (folds sub + stereotype + ports — the visible chrome is terse). */
  ariaLabel: string;
  onSelect?: () => void;
  className?: string;
}

const GLYPH: Record<NodeCardPortDirection, string> = { provided: '○', required: '⊃' };
const MAX_VISIBLE_PORTS = 4;

/**
 * NodeCard — the shared node body for nested / structural node-link viz. A single
 * focusable button carrying a tone accent bar, an optional UML stereotype, the
 * label + sub, provided/required interface ports, and an information-scent badge.
 * SystemMap renders it now; ClassDiagram will reuse it with attribute/method
 * compartments. The decorative chrome (tone bar, port glyphs) is aria-hidden — the
 * full meaning rides on `ariaLabel`.
 */
export function NodeCard({
  label,
  sub,
  stereotype,
  icon,
  tone,
  color,
  variant = 'leaf',
  badge,
  ports,
  selected,
  emphasized,
  external,
  ariaLabel,
  onSelect,
  className,
}: NodeCardProps) {
  const visiblePorts = ports?.slice(0, MAX_VISIBLE_PORTS) ?? [];
  const overflow = (ports?.length ?? 0) - visiblePorts.length;
  return (
    <button
      type="button"
      className={cx(
        'tcl-nodecard',
        `is-${variant}`,
        selected && 'is-selected',
        emphasized && 'is-emphasized',
        external && 'has-external',
        className,
      )}
      style={vars({ '--node': color ?? toneVar(tone ?? 'neutral') })}
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
    >
      {stereotype && <span className="tcl-nodecard__stereotype">{stereotype}</span>}
      <span className="tcl-nodecard__heading">
        {icon && (
          <span className="tcl-nodecard__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="tcl-nodecard__label">{label}</span>
      </span>
      {sub && <span className="tcl-nodecard__sub">{sub}</span>}
      {visiblePorts.length > 0 && (
        <span className="tcl-nodecard__ports" aria-hidden="true">
          {visiblePorts.map((p) => (
            <span key={p.id} className="tcl-nodecard__port" data-dir={p.direction}>
              <span className="tcl-nodecard__port-glyph">{GLYPH[p.direction]}</span>
              {p.label}
            </span>
          ))}
          {overflow > 0 && <span className="tcl-nodecard__port is-more">+{overflow}</span>}
        </span>
      )}
      {badge && (
        <span className="tcl-nodecard__badge" aria-hidden="true">
          {badge}
        </span>
      )}
    </button>
  );
}
