import type { SwimlaneContract } from '../components/Swimlane/Swimlane';
import type { RunRecord } from '../components/RunHistory/RunHistory';

/**
 * Run-over-definition time-travel: derive a `SwimlaneContract` that shows a
 * single run's state. A run's per-step outcomes overwrite each step's status;
 * steps the run never reached fall back to `pending`. Per-step outputs are
 * folded into the step note so Swimlane's existing inspector surfaces them —
 * Swimlane itself needs no run awareness (its layout is a pure `data => layout`).
 *
 * The canonical pairing of `RunHistory` + `Swimlane` (see the
 * `Examples/SwimlaneRuns` page). Exported because consuming apps were
 * hand-copying this exact transform — one source of truth beats drifting copies.
 */
export function applyRun(base: SwimlaneContract, run: RunRecord): SwimlaneContract {
  if (!run.stepOutcomes?.length) return base;
  const byStep = new Map(run.stepOutcomes.map((o) => [o.step, o]));
  return {
    ...base,
    // `?? []` mirrors Swimlane's own lenient parse — this is a public export
    // aimed at authored JSON, so a missing steps array must not throw.
    steps: (base.steps ?? []).map((step) => {
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
