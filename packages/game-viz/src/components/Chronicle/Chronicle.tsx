import { Timeline } from '@trembus/ui';
import type { TimelineContract, TimelineTone } from '@trembus/ui';
import { cx } from '../../internal/cx';
import './Chronicle.css';

/** The Chronicle consumes the same authored shape as the ui `Timeline`. */
export type { TimelineContract as ChronicleContract } from '@trembus/ui';

/**
 * `Chronicle` — the liturgical-gothic skin over the ui `Timeline`. It frames the
 * dated-event axis in a reliquary-dark plate with a display-serif title plate,
 * a tone-tinted border, and an optional archive tab, and re-tints the whole
 * timeline accent (scrubber · selection · numeral · inspector rail) via the
 * `--tcl-timeline-accent` token hook — defaulting to the order's blood-red
 * `danger`. The interactive spine is the Timeline's: real focusable event
 * buttons, prev/next, and a live inspector. Theatrical surface, accessible spine.
 */
export type ChronicleTone = TimelineTone;

export interface ChronicleProps {
  /** The chronicle contract — the same shape as the ui `Timeline`. */
  data: TimelineContract;
  /** Controlled selected event id. */
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  /** Frame accent (scrubber · selection · numeral · inspector rail). Default `danger`. */
  tone?: ChronicleTone;
  /** Top-left archive tab, e.g. "The Reliquary Archive". */
  archive?: string;
  className?: string;
}

export function Chronicle({
  data,
  selectedId,
  defaultSelectedId,
  onSelect,
  tone = 'danger',
  archive,
  className,
}: ChronicleProps) {
  return (
    <div className={cx('tcl-chronicle', className)} data-tone={tone}>
      {archive && <span className="tcl-chronicle__archive">{archive}</span>}
      <Timeline
        data={data}
        selectedId={selectedId}
        defaultSelectedId={defaultSelectedId}
        onSelect={onSelect}
        className="tcl-chronicle__timeline"
      />
    </div>
  );
}
