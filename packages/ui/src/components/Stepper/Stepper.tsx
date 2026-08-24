import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import './Stepper.css';

/** Where a step sits in a multi-step operation. */
export type StepStatus = 'done' | 'active' | 'pending' | 'error';

export interface StepperStep {
  /** Stable id. Omitted → derived from position (never the label — duplicate labels must not collide). */
  id?: string;
  /** The step name. Doubles as its accessible text. */
  label: string;
  /** Optional detail under the label (a count, a note, a live sub-status). */
  description?: ReactNode;
  /** Step status (default `pending`). */
  status?: StepStatus;
  /** Override the status glyph in the node (else a check / dot / ✕ is chosen from `status`). */
  icon?: ReactNode;
}

export interface StepperProps {
  /** The ordered steps, top to bottom. */
  steps: StepperStep[];
  /** Node + type scale (default `md`). */
  size?: 'sm' | 'md';
  /** Accessible name for the step list (default `Progress`). */
  label?: string;
  className?: string;
}

const STATUS_WORD: Record<StepStatus, string> = {
  done: 'Completed',
  active: 'In progress',
  pending: 'Not started',
  error: 'Error',
};

function StatusGlyph({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <svg className="tcl-stepper__glyph" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12l4 4L19 7" />
      </svg>
    );
  }
  if (status === 'error') {
    return (
      <svg className="tcl-stepper__glyph" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    );
  }
  // active + pending both render a dot; the color comes from `data-status` in CSS.
  return <span className="tcl-stepper__dot" aria-hidden="true" />;
}

/**
 * `Stepper` — an ordered list of the steps in a multi-step operation, each marked
 * `done` / `active` / `pending` / `error`. Lead job: **reveal state** — a read-out of
 * where a process stands, never a control. The active step carries `aria-current`
 * and (motion permitting) a gentle pulse.
 */
export function Stepper({ steps, size = 'md', label = 'Progress', className }: StepperProps) {
  return (
    <ol className={cx('tcl-stepper', className)} data-size={size} aria-label={label}>
      {steps.map((step, i) => {
        const status = step.status ?? 'pending';
        return (
          <li
            key={step.id ?? `s${i}`}
            className="tcl-stepper__step"
            data-status={status}
            aria-current={status === 'active' ? 'step' : undefined}
          >
            <div className="tcl-stepper__rail">
              <span className="tcl-stepper__node">
                {step.icon ?? <StatusGlyph status={status} />}
              </span>
              {i < steps.length - 1 && <span className="tcl-stepper__line" aria-hidden="true" />}
            </div>
            <div className="tcl-stepper__body">
              <span className="tcl-stepper__sr">{STATUS_WORD[status]}: </span>
              <span className="tcl-stepper__label">{step.label}</span>
              {step.description != null && (
                <div className="tcl-stepper__desc">{step.description}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
