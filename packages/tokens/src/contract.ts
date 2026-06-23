/**
 * The first-principles contract every component must satisfy. This type is the
 * single source of truth for a component's "3 jobs" claim — the same object
 * feeds Storybook docs, the CI checker, and review. Because the three jobs are
 * non-optional fields, a component literally cannot compile without declaring
 * how it satisfies each one.
 */
export type UIJob = 'reveal-state' | 'afford-action' | 'acknowledge-input';

export interface JobSatisfaction {
  /** Plain-language statement of HOW this component satisfies the job. */
  satisfiedBy: string;
  /** Exact name of the exported Storybook story that DEMONSTRATES this job. */
  story: string;
}

export interface ComponentContract {
  /** Display name — must match the component's export. */
  name: string;
  /** The job this component leads with (it still satisfies all three). */
  leadJob: UIJob;
  /** The three irreducible UI jobs — non-optional by design. */
  jobs: {
    /** Make machine/data state perceivable. */
    revealState: JobSatisfaction;
    /** Expose capability with a visible affordance. */
    affordAction: JobSatisfaction;
    /** Respond perceivably to every input — close the feedback loop. */
    acknowledgeInput: JobSatisfaction;
  };
  a11y: {
    role?: string;
    keyboard?: string[];
    focusRing?: boolean;
  };
  /** Token families this component reads (documents the color-coded ontology). */
  tokensUsed?: string[];
}
