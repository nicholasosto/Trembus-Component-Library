/* @trembus-template workflow-board v1.0.0 · WorkflowBoard.tsx (main) · chrome is template-owned — edit only inside @tcl-slot regions; re-apply via the trembus-template skill */
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Card,
  DataStatusBar,
  Inline,
  RunHistory,
  Stack,
  Swimlane,
  Switch,
  Text,
  Toolbar,
} from '@trembus/ui';
import type { DataMetric, DataStatus, RunRecord, SwimlaneContract } from '@trembus/ui';

export interface WorkflowBoardProps {
  /** Page heading. */
  title: string;
  /** The workflow definition (lanes × steps). Steps should carry NO status —
   *  each run supplies it. */
  workflow: SwimlaneContract;
  /** Past executions; selecting one replays its state on the board. Empty or
   *  omitted → the Run history switch disables and the bare definition shows. */
  runs?: RunRecord[];
  /** Freshness of the data feeding the board (drives the DataStatusBar). */
  dataStatus?: DataStatus;
  /** Machine timestamp of the last update. */
  updatedAt?: string | number | Date;
  /** Human freshness text, e.g. "Updated 4m ago". */
  updatedLabel?: ReactNode;
  /** Scope metrics shown in the status bar (run counts, coverage, …). */
  metrics?: DataMetric[];
  /** Re-pull handler — surfaces a Refresh action in the board toolbar. */
  onRefresh?: () => void;
}

// Duplicated from @trembus/ui's SwimlaneRuns example (packages/ui/src/examples/
// applyRun.ts) — deliberately page-local, unexported library code, so a
// copy-and-own page carries its own copy. Time-travel: a run's per-step
// outcomes overwrite each step's status; unreached steps fall back to pending;
// per-step outputs fold into the step note so Swimlane's inspector surfaces them.
function applyRun(base: SwimlaneContract, run: RunRecord): SwimlaneContract {
  if (!run.stepOutcomes?.length) return base;
  const byStep = new Map(run.stepOutcomes.map((o) => [o.step, o]));
  return {
    ...base,
    steps: base.steps.map((step) => {
      const outcome = step.id != null ? byStep.get(step.id) : undefined;
      if (!outcome) return { ...step, status: 'pending' };
      const outs = outcome.outputs?.length
        ? `Output: ${outcome.outputs.map((o) => o.label).join(', ')}`
        : undefined;
      const note = [step.note, outs].filter(Boolean).join(' · ') || undefined;
      return { ...step, status: outcome.status, note };
    }),
  };
}

/**
 * A workflow working surface: DataStatusBar freshness header, title row with a
 * board toolbar, an optional RunHistory log (toggled by a Switch, disabled when
 * there is no history), and the Swimlane board — selecting a run time-travels
 * the diagram to that run's state.
 */
export function WorkflowBoard({
  title,
  workflow,
  runs = [],
  dataStatus,
  updatedAt,
  updatedLabel,
  metrics,
  onRefresh,
}: WorkflowBoardProps) {
  const hasRuns = runs.length > 0;
  // Start on the failed run (if present) so the time-travel shows immediately.
  const [selectedRunId, setSelectedRunId] = useState(
    () => runs.find((r) => r.status === 'failed')?.id ?? runs[0]?.id ?? '',
  );
  const [showRuns, setShowRuns] = useState(true);

  const runsVisible = showRuns && hasRuns;
  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? runs[0];

  // Keep the board's caption honest about what is (or isn't) being replayed.
  const board: SwimlaneContract =
    runsVisible && selectedRun
      ? {
          ...applyRun(workflow, selectedRun),
          caption: 'Selected run replayed across the lanes — pick another above.',
        }
      : {
          ...workflow,
          caption: hasRuns
            ? 'Run history is hidden — switch it on to replay past executions.'
            : 'No run history yet — this is the workflow definition.',
        };

  const showStatusBar =
    dataStatus !== undefined ||
    updatedAt !== undefined ||
    updatedLabel !== undefined ||
    (metrics && metrics.length > 0);

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: 'var(--tcl-space-6)' }}>
      <Stack gap={5}>
        {showStatusBar && (
          <DataStatusBar
            status={dataStatus ?? 'live'}
            updatedAt={updatedAt}
            updatedLabel={updatedLabel}
            metrics={metrics}
          />
        )}

        <Inline justify="between" align="center" wrap gap={4}>
          <Stack gap={1}>
            <Text
              size="xs"
              tone="faint"
              mono
              style={{ textTransform: 'uppercase', letterSpacing: '0.14em' }}
            >
              Workflow board
            </Text>
            <Text as="h1" size="xl" weight="bold">
              {title}
            </Text>
          </Stack>

          <Inline align="center" gap={4} wrap>
            {/* @tcl-slot:toolbar-actions START — app-owned: board commands. Context:
                onRefresh. Replace with your own Toolbar/buttons; keep the toolbar
                labelled. */}
            {onRefresh && (
              <Toolbar aria-label="Board actions">
                <Toolbar.Button onClick={onRefresh}>Refresh</Toolbar.Button>
              </Toolbar>
            )}
            {/* @tcl-slot:toolbar-actions END */}
            <Switch
              label={hasRuns ? `Run history · ${runs.length}` : 'Run history'}
              checked={runsVisible}
              disabled={!hasRuns}
              title={hasRuns ? undefined : 'No run history yet for this workflow'}
              onChange={(event) => setShowRuns(event.currentTarget.checked)}
            />
          </Inline>
        </Inline>

        <Stack gap={5}>
          {runsVisible && (
            <RunHistory
              data={{
                view: 'run-history',
                title: 'Run history',
                caption: 'Past executions. Select one to replay it on the board.',
                runs,
              }}
              selectedRunId={selectedRunId}
              onSelectRun={setSelectedRunId}
            />
          )}
          <Card>
            <Card.Body>
              {/* key by run so the diagram's own step-selection resets on run change */}
              <Swimlane key={runsVisible ? selectedRunId : 'definition'} data={board} />
            </Card.Body>
          </Card>
        </Stack>

        {/* @tcl-slot:inspector START — app-owned: details for the selected run.
            Context: runsVisible, selectedRun, workflow, runs. */}
        {runsVisible && selectedRun && (
          <Card>
            <Card.Header>Selected run · {selectedRun.label ?? selectedRun.id}</Card.Header>
            <Card.Body>
              <Stack gap={2}>
                <Text size="sm">
                  Status:{' '}
                  <Text as="span" size="sm" mono>
                    {selectedRun.status}
                  </Text>
                </Text>
                {selectedRun.note && (
                  <Text size="sm" tone="dim">
                    {selectedRun.note}
                  </Text>
                )}
                {selectedRun.outputs && selectedRun.outputs.length > 0 && (
                  <Inline gap={3} wrap>
                    {selectedRun.outputs.map((out) => (
                      <a key={`${out.kind}:${out.label}`} href={out.href}>
                        <Text as="span" size="sm" mono>
                          {out.label}
                        </Text>
                      </a>
                    ))}
                  </Inline>
                )}
              </Stack>
            </Card.Body>
          </Card>
        )}
        {/* @tcl-slot:inspector END */}
      </Stack>
    </div>
  );
}
