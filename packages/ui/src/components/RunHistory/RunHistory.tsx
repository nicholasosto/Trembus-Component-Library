import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import type { FillBarTone } from '../../internal/fillbar';
import { Badge } from '../Badge/Badge';
import { Table } from '../Table/Table';
import type { SortDescriptor } from '../Table/Table';
import type { SwimlaneStatus } from '../Swimlane/Swimlane';
import './RunHistory.css';

/**
 * `RunHistory` — a selectable log of past executions ("runs") of a workflow or any
 * data-driven item (CI pipelines, ETL jobs, agent sessions). Built on the public
 * `Table`: each run is a focusable, keyboard-accessible row (status · when ·
 * duration · steps · outputs) and selecting one reveals its outcome note and the
 * real **output/result links** in a single `aria-live` inspector — the Hub/BarChart
 * interaction spine, with controlled/uncontrolled `selectedRunId`.
 *
 * A run carries an optional `stepOutcomes` (per-step statuses, reusing the Swimlane
 * vocabulary) which lets a host "time-travel" a `Swimlane` to that run — see the
 * `Examples/SwimlaneRuns` page. Standalone, RunHistory needs no Swimlane.
 */
export type RunStatus = 'succeeded' | 'failed' | 'running' | 'cancelled' | 'partial' | 'queued';
export type RunOutputKind = 'pr' | 'doc' | 'log' | 'dataset' | 'deploy' | 'link';
/** What the run did to the artifact — renders a git-style `+` / `~` / `−` chip prefix. */
export type RunOutputOp = 'create' | 'modify' | 'delete';

export interface RunOutput {
  /** Stable id; falls back to the index, NEVER the label (the recurring viz-id gotcha). */
  id?: string;
  /** Link/artifact text, e.g. "transcript.md", "PR #482". */
  label: string;
  /** When set the chip is a real `<a>`; omit for a static (non-link) artifact chip. */
  href?: string;
  /** Artifact class → a tone-coded chip. */
  kind?: RunOutputKind;
  /** File-op the run performed on this artifact → a `+` / `~` / `−` prefix mark. */
  op?: RunOutputOp;
}

/** Per-step outcome for THIS run — the bridge that lets a host time-travel a Swimlane. */
export interface RunStepOutcome {
  /** Matches a `SwimlaneStep` id. */
  step: string;
  /** Reuses the step status ontology verbatim. */
  status: SwimlaneStatus;
  /** Artifacts produced at this step. */
  outputs?: RunOutput[];
}

export interface RunRecord {
  /** Stable id for selection; falls back to `r${i}`. */
  id?: string;
  /** Human label, e.g. "#128" or "nightly-2026-06-21"; defaults to the id. */
  label?: string;
  /** Outcome of THIS execution (distinct from a step's status). */
  status: RunStatus;
  /** When it ran (ISO string / epoch ms / Date) → `<time>` + a relative readout. */
  startedAt: string | number | Date;
  /** Wall-clock ms → "4m 12s"; omit for an in-flight run (renders an em-dash). */
  durationMs?: number;
  /** What kicked it off, e.g. "manual", "schedule", an author. */
  trigger?: string;
  /** One-line outcome shown in the inspector. */
  note?: string;
  /** Per-step outcomes — powers run→step time-travel in a host. */
  stepOutcomes?: RunStepOutcome[];
  /** Run-level artifacts/links (rolled up); shown as chips in the inspector. */
  outputs?: RunOutput[];
  /** Optional precomputed step tally for the dense cell (else derived from stepOutcomes). */
  tally?: Partial<Record<SwimlaneStatus, number>>;
}

export interface RunHistoryContract {
  /** Contract discriminator. */
  view?: 'run-history';
  /** Small brand line above the header. */
  brand?: string;
  /** Mono code line, e.g. "workflow.ship-feature.runs". */
  code?: string;
  /** Header title; also the table's accessible name (falls back to "Run history"). */
  title?: string;
  /** One-line caption under the title. */
  caption?: string;
  /** The executions, newest or oldest first — the view sorts by `startedAt` itself. */
  runs: RunRecord[];
}

export interface RunHistoryProps {
  /** The run-history contract to render. */
  data: RunHistoryContract;
  /** Controlled selected run id. */
  selectedRunId?: string;
  /** Uncontrolled initial selection. */
  defaultSelectedRunId?: string;
  /** Called with the run id on selection. */
  onSelectRun?: (id: string) => void;
  /** Row padding scale, passed through to `Table` (default `comfortable`). */
  density?: 'comfortable' | 'compact';
  className?: string;
}

/** Run-level tone map — its own palette, mapped to the SAME tone tokens, never SwimlaneStatus. */
const RUN_STATUS_META: Record<RunStatus, { tone: FillBarTone; word: string }> = {
  succeeded: { tone: 'success', word: 'Succeeded' },
  failed: { tone: 'danger', word: 'Failed' },
  running: { tone: 'accent', word: 'Running' },
  cancelled: { tone: 'warning', word: 'Cancelled' },
  partial: { tone: 'warning', word: 'Partial' },
  queued: { tone: 'neutral', word: 'Queued' },
};

/** Per-step status → tone + word (for the dense step tally). */
const STEP_META: Record<SwimlaneStatus, { tone: FillBarTone; word: string }> = {
  done: { tone: 'success', word: 'done' },
  active: { tone: 'accent', word: 'active' },
  blocked: { tone: 'danger', word: 'blocked' },
  pending: { tone: 'neutral', word: 'pending' },
  skipped: { tone: 'neutral', word: 'skipped' },
};
const STEP_ORDER: SwimlaneStatus[] = ['done', 'active', 'blocked', 'pending', 'skipped'];

const OUTPUT_TONE: Record<RunOutputKind, FillBarTone> = {
  pr: 'accent',
  deploy: 'success',
  doc: 'info',
  dataset: 'info',
  log: 'neutral',
  link: 'neutral',
};

/**
 * Git-style op marks. The sign is decorative (`aria-hidden`) — the sr-only word
 * beside it puts the op into the chip's accessible name, so a screen reader hears
 * "created report.pdf", never "tilde".
 */
const OP_META: Record<RunOutputOp, { sign: string; word: string }> = {
  create: { sign: '+', word: 'created' },
  modify: { sign: '~', word: 'modified' },
  delete: { sign: '−', word: 'deleted' },
};

const OUTPUT_CAP = 8;

const idOf = (r: RunRecord, i: number): string => r.id ?? `r${i}`;
const outIdOf = (o: RunOutput, i: number): string => o.id ?? `o${i}`;

function toMs(value: string | number | Date): number | null {
  const t =
    value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

function toIso(value: string | number | Date): string | undefined {
  const t = toMs(value);
  return t == null ? (typeof value === 'string' ? value : undefined) : new Date(t).toISOString();
}

/** A compact relative readout against a single captured `now`. */
function formatWhen(value: string | number | Date, now: number): string {
  const t = toMs(value);
  if (t == null) return '';
  const past = now - t >= 0;
  const sec = Math.round(Math.abs(now - t) / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return past ? `${min}m ago` : `in ${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return past ? `${hr}h ago` : `in ${hr}h`;
  const day = Math.round(hr / 24);
  if (day === 1) return past ? 'yesterday' : 'tomorrow';
  if (day < 7) return past ? `${day}d ago` : `in ${day}d`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDuration(ms?: number): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sr = s % 60;
  if (m < 60) return sr ? `${m}m ${sr}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const mr = m % 60;
  return mr ? `${h}h ${mr}m` : `${h}h`;
}

function tallyOf(run: RunRecord): Array<[SwimlaneStatus, number]> {
  const t: Partial<Record<SwimlaneStatus, number>> = run.tally ?? {};
  if (!run.tally && run.stepOutcomes) {
    for (const o of run.stepOutcomes) t[o.status] = (t[o.status] ?? 0) + 1;
  }
  return STEP_ORDER.filter((s) => (t[s] ?? 0) > 0).map((s) => [s, t[s] as number]);
}

function ranCount(run: RunRecord): number {
  return tallyOf(run).reduce((sum, [, n]) => sum + n, 0);
}

export function RunHistory({
  data,
  selectedRunId: selProp,
  defaultSelectedRunId,
  onSelectRun,
  density = 'comfortable',
  className,
}: RunHistoryProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultSelectedRunId);
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelectRun?.(id);
  };

  const [sort, setSort] = useState<SortDescriptor>({ column: 'started', direction: 'desc' });

  // Stable ids first (original index), so sorting can never change a run's key.
  const withIds = useMemo(
    () => (data.runs ?? []).map((run, i) => ({ run, id: idOf(run, i) })),
    [data.runs],
  );

  const ordered = useMemo(() => {
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...withIds].sort((a, b) => {
      if (sort.column === 'duration') {
        const da = a.run.durationMs;
        const db = b.run.durationMs;
        // in-flight (no duration) sinks to the end regardless of direction
        if (da == null && db == null) return 0;
        if (da == null) return 1;
        if (db == null) return -1;
        return (da - db) * dir;
      }
      return ((toMs(a.run.startedAt) ?? 0) - (toMs(b.run.startedAt) ?? 0)) * dir;
    });
  }, [withIds, sort]);

  const selected = withIds.find((x) => x.id === selectedId)?.run;
  const now = Date.now();

  return (
    <div className={cx('tcl-run-history', className)}>
      {(data.code || data.title || data.caption || data.brand) && (
        <header className="tcl-run-history__header">
          {data.brand && <p className="tcl-run-history__brand">{data.brand}</p>}
          {data.code && <p className="tcl-run-history__code">{data.code}</p>}
          {data.title && <p className="tcl-run-history__title">{data.title}</p>}
          {data.caption && <p className="tcl-run-history__caption">{data.caption}</p>}
        </header>
      )}

      <Table
        density={density}
        sortDescriptor={sort}
        onSortChange={setSort}
        aria-label={data.title ?? 'Run history'}
      >
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell>Run</Table.HeaderCell>
            <Table.HeaderCell sortKey="started">Started</Table.HeaderCell>
            <Table.HeaderCell sortKey="duration" align="end">
              Duration
            </Table.HeaderCell>
            <Table.HeaderCell>Steps</Table.HeaderCell>
            <Table.HeaderCell align="end">Outputs</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {ordered.length === 0 ? (
            <Table.Empty colSpan={5}>No runs yet</Table.Empty>
          ) : (
            ordered.map(({ run, id }) => {
              const meta = RUN_STATUS_META[run.status];
              const isSelected = id === selectedId;
              const label = run.label ?? id;
              const when = formatWhen(run.startedAt, now);
              const dur = formatDuration(run.durationMs);
              const tally = tallyOf(run);
              const outCount = run.outputs?.length ?? 0;
              const stepsSummary =
                tally.length > 0
                  ? tally.map(([s, n]) => `${n} ${STEP_META[s].word}`).join(', ')
                  : 'no step detail';
              return (
                <Table.Row
                  key={id}
                  rowKey={id}
                  onClick={() => select(id)}
                  className={cx(isSelected && 'is-run-selected')}
                >
                  <Table.Cell>
                    <span className="tcl-run-history__run">
                      {/* visible badge + label are decorative; the sr span is the
                          authoritative, space-correct accessible name for the row button */}
                      <span
                        aria-hidden="true"
                        className={cx(
                          'tcl-run-history__status',
                          run.status === 'running' && 'is-running',
                        )}
                      >
                        <Badge tone={meta.tone} dot variant="soft" size="sm">
                          {meta.word}
                        </Badge>
                      </span>
                      <span aria-hidden="true" className="tcl-run-history__run-label">
                        {label}
                      </span>
                      <span className="tcl-run-history__sr">
                        {meta.word} {label}, started {when || 'unknown'},{' '}
                        {dur === '—' ? 'in progress' : dur}, {stepsSummary}, {outCount} output
                        {outCount === 1 ? '' : 's'}
                      </span>
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <time className="tcl-run-history__when" dateTime={toIso(run.startedAt)}>
                      {when}
                    </time>
                  </Table.Cell>
                  <Table.Cell numeric>{dur}</Table.Cell>
                  <Table.Cell>
                    <span className="tcl-run-history__steps">
                      {tally.length === 0 ? (
                        <span className="tcl-run-history__steps-none">—</span>
                      ) : (
                        tally.map(([s, n], i) => (
                          <span
                            key={s}
                            className={cx('tcl-run-history__tally', `is-${STEP_META[s].tone}`)}
                          >
                            {i > 0 && <span className="tcl-run-history__tally-sep"> · </span>}
                            {n} {STEP_META[s].word}
                          </span>
                        ))
                      )}
                    </span>
                  </Table.Cell>
                  <Table.Cell numeric>{outCount}</Table.Cell>
                </Table.Row>
              );
            })
          )}
        </Table.Body>
      </Table>

      <div className="tcl-run-history__inspector" aria-live="polite">
        {selected ? (
          <RunInspector run={selected} />
        ) : (
          <p className="tcl-run-history__inspector-hint">
            Select a run to see its outputs and results.
          </p>
        )}
      </div>
    </div>
  );
}

function RunInspector({ run }: { run: RunRecord }) {
  const meta = RUN_STATUS_META[run.status];
  const dur = formatDuration(run.durationMs);
  const ran = ranCount(run);
  const outputs = run.outputs ?? [];
  const shown = outputs.slice(0, OUTPUT_CAP);
  const extra = outputs.length - shown.length;
  return (
    <>
      <p className="tcl-run-history__inspector-title">
        <span className={cx('tcl-run-history__status', run.status === 'running' && 'is-running')}>
          <Badge tone={meta.tone} dot variant="soft" size="sm">
            {meta.word}
          </Badge>
        </span>
        <span className="tcl-run-history__inspector-label">{run.label ?? 'Run'}</span>
        <span className="tcl-run-history__inspector-meta">
          {' · '}
          {dur === '—' ? 'in progress' : dur}
          {ran > 0 && ` · ran ${ran} step${ran === 1 ? '' : 's'}`}
          {run.trigger && ` · ${run.trigger}`}
        </span>
      </p>
      {run.note && <p className="tcl-run-history__inspector-note">{run.note}</p>}
      {outputs.length > 0 ? (
        <div className="tcl-run-history__outputs">
          {shown.map((o, i) => (
            <OutputChip key={outIdOf(o, i)} output={o} />
          ))}
          {extra > 0 && <span className="tcl-run-history__more">+{extra} more</span>}
        </div>
      ) : (
        <p className="tcl-run-history__no-outputs">No outputs recorded for this run.</p>
      )}
    </>
  );
}

function OutputChip({ output }: { output: RunOutput }): ReactNode {
  const tone = OUTPUT_TONE[output.kind ?? 'link'];
  const cls = cx('tcl-run-history__chip', `is-${tone}`);
  // Own-property check so junk op strings (incl. prototype-chain names like
  // 'constructor') degrade to an op-less chip instead of an empty stub.
  const op = output.op && Object.hasOwn(OP_META, output.op) ? OP_META[output.op] : undefined;
  const body = (
    <>
      {op && (
        <>
          <span className="tcl-run-history__chip-op" aria-hidden="true">
            {op.sign}
          </span>
          <span className="tcl-sr-only">{op.word}</span>
        </>
      )}
      {output.label}
    </>
  );
  if (output.href) {
    return (
      <a className={cls} href={output.href}>
        {body}
        <span className="tcl-run-history__chip-ext" aria-hidden="true">
          ↗
        </span>
      </a>
    );
  }
  return <span className={cls}>{body}</span>;
}
