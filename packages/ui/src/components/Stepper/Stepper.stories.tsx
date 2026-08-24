import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stepper } from './Stepper';
import type { StepperStep } from './Stepper';

const flow: StepperStep[] = [
  { label: 'Reviewing files by type category', status: 'done', description: '24 files typed' },
  {
    label: 'Identifying & moving exact duplicates',
    status: 'done',
    description: '3 duplicates found',
  },
  { label: 'Reviewing contents', status: 'done', description: '24 files read' },
  {
    label: 'Contextually organizing',
    status: 'active',
    description: 'grouping by inferred purpose — 14 of 24…',
  },
  { label: 'Identifying redundant information within files', status: 'pending' },
  { label: 'Drafting final reorg plan', status: 'pending' },
];

/**
 * `Stepper` — the ordered steps of a multi-step operation, each marked `done` /
 * `active` / `pending` / `error`. Lead job: reveal state — a read-out of where a
 * process stands, not a control the user drives.
 *
 * ### When to use it
 * - A finite, ordered sequence whose current position matters: an import pipeline,
 *   an install, a review flow, a wizard's progress rail.
 * - Not for a single measurable quantity — use `Progress` (bar) or `Meter` (gauge).
 * - Not for events on a timeline or milestones — use `Timeline` / `MilestoneTrack`.
 * - Not for an unknown-length wait — use `Spinner`.
 *
 * ### Data & key props
 * - `steps` (required) — each `{ label, status?, description?, id?, icon? }`; `status`
 *   is `done | active | pending | error` (default `pending`).
 * - `size` — `md` (default) or `sm`. `label` — the list's accessible name.
 * - Ids are optional; an omitted id derives from position (never the label), so
 *   duplicate labels never collide.
 *
 * ### Accessibility
 * - Renders an `<ol>` (`role="list"`) named by `label`; each step is a `listitem`.
 * - The active step carries `aria-current="step"`; every step's status is also a
 *   visually-hidden word ("Completed", "In progress", …) so status never rides on
 *   colour alone.
 * - Node glyphs and connectors are `aria-hidden`; the active pulse is suppressed
 *   under `prefers-reduced-motion`.
 *
 * ### Theming & setup
 * - `done` → `var(--tcl-status-success)`, `active` → `var(--tcl-accent)`, `error` →
 *   `var(--tcl-status-danger)`; works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  args: { steps: flow, label: 'Deep Clean progress' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — an ordered process mid-run: three done, one active, two pending. */
export const Default: Story = {};

/** Job: Afford Action — the same read-out at two densities (`md` and `sm`). */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 40, gridTemplateColumns: '1fr 1fr', minWidth: 560 }}>
      <Stepper steps={flow} size="md" label="Medium" />
      <Stepper steps={flow} size="sm" label="Small" />
    </div>
  ),
};

/** Job: Acknowledge Input — the four statuses, including an error step. */
export const States: Story = {
  render: () => (
    <Stepper
      label="All statuses"
      steps={[
        { label: 'Completed step', status: 'done', description: 'finished cleanly' },
        { label: 'Active step', status: 'active', description: 'running now…' },
        { label: 'Failed step', status: 'error', description: 'could not read 2 files' },
        { label: 'Pending step', status: 'pending' },
      ]}
    />
  ),
};
