import type { RunRecord, SwimlaneContract } from '../index';

/**
 * Page-local time-travel (NOT a library export): derive a `SwimlaneContract` that
 * shows a single run's state. A run's per-step outcomes overwrite each step's
 * status; steps the run never reached fall back to `pending`. Per-step outputs are
 * folded into the step note so Swimlane's existing inspector surfaces them — no
 * change to Swimlane is needed (its layout is a pure `data => layout`).
 *
 * Lives in src/examples/ (co-located, ungated) so it can never fail `check:contracts`;
 * graduate it to src/internal/ only if a second consumer appears.
 */
export function applyRun(base: SwimlaneContract, run: RunRecord): SwimlaneContract {
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
