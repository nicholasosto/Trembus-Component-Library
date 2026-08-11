import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { MilestoneTrack } from './MilestoneTrack';
import type { MilestoneTrackContract } from './MilestoneTrack';

// A real lead-time contract — the delivery-ops strip: opportunity → ticket →
// project → first invoice, measured where the sources are wired, pending where
// they are not. The long-span metric (project → invoice) demonstrates the
// measured-span whisker: its bubble sits in the last free gap before `to`.
const leadTime: MilestoneTrackContract = {
  view: 'milestone-track',
  code: 'LT',
  brand: 'Delivery Ops',
  title: 'Completed lead time',
  caption: 'Opportunity to first invoice across the source systems',
  unit: 'd',
  stations: [
    { id: 'opp', label: 'Opportunity', sub: '≥80%', note: 'Won-stage opportunities only.' },
    { id: 'ticket', label: 'Ticket created' },
    { id: 'project', label: 'Project created' },
    { id: 'role', label: 'First role', status: 'pending', badge: 'pending source' },
    { id: 'hours', label: 'First hours', status: 'pending', badge: 'pending source' },
    { id: 'sched', label: '90% scheduled', status: 'pending', badge: 'pending source' },
    { id: 'invoice', label: 'First invoice' },
  ],
  metrics: [
    {
      id: 'ticket-project',
      from: 'ticket',
      to: 'project',
      value: 2.6,
      label: 'Ticket → project',
      count: '605 completed',
      note: 'Service-desk intake to project spin-up.',
    },
    {
      id: 'project-invoice',
      from: 'project',
      to: 'invoice',
      value: 26.3,
      label: 'Project → first invoice',
      count: '427 completed',
      note: 'Staffing milestones are not instrumented yet, so this span is measured end to end.',
    },
  ],
  groups: [
    { label: 'Salesforce', glyph: 'cloud', from: 'opp', to: 'opp' },
    { label: 'Jira Service Desk', glyph: 'zap', from: 'ticket', to: 'project' },
    { label: 'Projector', glyph: 'box', from: 'role', to: 'invoice' },
  ],
};

// A compact deploy pipeline exercising every status word and metric tone.
const release: MilestoneTrackContract = {
  title: 'Release pipeline',
  caption: 'Complete · in progress · pending — one interval metric per gap',
  unit: 'h',
  stations: [
    { id: 'commit', label: 'Commit' },
    { id: 'build', label: 'Build green' },
    { id: 'canary', label: 'Canary', status: 'active', sub: 'wave 2 of 4' },
    { id: 'ga', label: 'GA rollout', status: 'pending', badge: 'awaiting canary' },
  ],
  metrics: [
    {
      from: 'commit',
      to: 'build',
      value: 0.4,
      label: 'Commit → build',
      count: '1,204 runs',
      tone: 'info',
    },
    {
      from: 'build',
      to: 'canary',
      value: 6.2,
      label: 'Build → canary',
      count: '89 releases',
      tone: 'warning',
    },
    {
      from: 'canary',
      to: 'ga',
      value: 18,
      label: 'Canary → GA',
      count: '61 releases',
      tone: 'danger',
    },
  ],
};

// The same pipeline snaking through the source systems: serpentine turns each
// group into a row, and the added project → staffing metric lands on the row
// break — the cross-system handoff wait, rendered on the next row's lead-in.
const serpentineLeadTime: MilestoneTrackContract = {
  ...leadTime,
  caption: 'One pipeline, a row per source system — capsule size tracks the bottleneck share',
  metrics: [
    ...(leadTime.metrics ?? []),
    {
      id: 'project-role',
      from: 'project',
      to: 'role',
      value: 11.4,
      label: 'Project → staffing',
      count: '318 completed',
      tone: 'danger',
      note: 'The cross-system handoff: waiting on staffing after project spin-up.',
    },
  ],
};

/**
 * A lead-time rail: milestones as stations on one horizontal line, with the rail
 * swelling into a measured **interval bubble** wherever a station pair carries a
 * metric — value, sample count, and a share-of-total meter so a 26 d interval
 * reads bigger than a 2.6 d one. Source-system bands sit above the rail, handoff
 * dividers mark the seams between them, and pending stations dash their segments.
 * Long tracks wrap into rows — `layout='wrap'` keeps every row reading LEFT-TO-RIGHT
 * and returns along one carriage-return connector, `layout='serpentine'` alternates
 * direction with U-turns — and `bubbleSizing='scaled'` grows each capsule with its
 * share so the worst bottleneck literally swells the pipe.
 *
 * ### When to use it
 * - Stage-to-stage lead/cycle time along ONE pipeline — opportunity → invoice,
 *   commit → deploy — where the durations BETWEEN milestones are the story.
 * - Still ONE pipeline, just wrapped for long tracks — not for branching or merging
 *   pipelines (`@trembus/viz` `Lineage`), actor handoffs (`Swimlane`), dated event
 *   chronicles (`Timeline`), or stage-count conversion (`Funnel`).
 *
 * ### Data & key props
 * - `data.stations` — `{ id?, label, sub?, status?, badge?, note? }[]` in flow order;
 *   give stable `id`s (fallback is the index, never the label).
 * - `data.metrics` — `{ from, to, value, label?, count?, tone?, weight?, unit?, note? }[]`;
 *   `from`/`to` match a station `id` or `label` and may span several stations — the
 *   bubble takes the last free gap before `to` and a dotted whisker underlines the
 *   full measured span. One bubble per gap; invalid or negative metrics are skipped.
 * - `data.groups` — `{ label, glyph?, from, to }[]` source-system bands; glyph names
 *   come from the `@trembus/icons` registry.
 * - `layout` — `'rail'` (default), `'wrap'`, or `'serpentine'`. Both wrapping modes cut
 *   one row per group (row headers replace the band chrome); stations outside any group
 *   form unlabeled rows and overlapping groups keep only their names. `'wrap'` keeps every
 *   row left→right, returning to the left margin along a single carriage-return connector
 *   — pick it when the track must READ like text; `'serpentine'` alternates row direction
 *   and adds left-chevrons to mirrored rows. A metric on the row break renders as the
 *   handoff-wait capsule on the next row's lead-in.
 * - `rowLength` — max stations per row when wrapping, applied within each group run; the
 *   only way to wrap a track with no groups.
 * - `bubbleSizing` — `'uniform'` (default) or `'scaled'`: capsule height tracks each
 *   interval's share of the measured total (the worst bottleneck reaches the max
 *   height; equal shares all read max). When shares are uncomputable (mixed units or
 *   a single metric) per-metric `weight` ratios take over; tiny capsules go compact
 *   (value + one label line).
 * - `labelPlacement` — `'inside'` (default) or `'outside'`: outside leaves only the
 *   measured value in the pillow, lifting the interval label above it and dropping the
 *   sample count + share meter below (the value-stream reading — it keeps small
 *   capsules legible and lets long interval names breathe past the capsule width).
 * - `data.unit` (default `d`) formats values; the header meta defaults to the summed
 *   total (e.g. "28.9 d measured") when units are uniform.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — controlled or uncontrolled selection.
 *
 * ### Accessibility
 * - Every station and bubble is a real `<button>` (`aria-pressed`) — stations are
 *   named "label — sub — status — badge — group", bubbles "label: value, count".
 *   Reading and tab order remain flow order across wrapped rows; connectors,
 *   direction chevrons, and row headers are decorative (the group name stays in
 *   member stations' accessible names).
 * - Selection announces via the `aria-live` inspector (which also carries the
 *   share-of-total percentage); the rail SVG, bands, and meters are decorative
 *   (`aria-hidden`), and status is always paired with a word, never color alone.
 *
 * ### Theming & setup
 * - `--tcl-milestonetrack-accent` skins the rail chrome — including row-break
 *   connectors and direction cues (read via fallback, never declared on the root);
 *   bubble tones use the status palette (default `warning`); accent painted as TEXT
 *   falls back to `--tcl-text` for AA. Works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Visualizations/MilestoneTrack',
  component: MilestoneTrack,
  args: { data: leadTime },
} satisfies Meta<typeof MilestoneTrack>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — every milestone and measured interval is a focusable button inviting inspection. */
export const Default: Story = {};

/** Job: Reveal State — statuses (complete / in progress / pending), per-interval tones, share meters, scaled capsule heights, and the empty state. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <MilestoneTrack data={release} />
      <MilestoneTrack
        data={{
          ...release,
          caption: 'Same pipeline with bubbleSizing="scaled" — height tracks share',
        }}
        bubbleSizing="scaled"
      />
      <MilestoneTrack data={{ title: 'Unconfigured pipeline', stations: [] }} />
    </div>
  ),
};

/**
 * Job: Reveal State — the same track twice, so the capsule text arrangements read
 * side by side: labels INSIDE the pillow (default) versus labels OUTSIDE it (the
 * value-stream reading — only the measured value stays in the swell, the interval
 * name rides above and the sample count + share meter drop below).
 */
export const LabelsOutside: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <MilestoneTrack
        data={{ ...serpentineLeadTime, caption: 'labelPlacement="inside" (default)' }}
        layout="serpentine"
        bubbleSizing="scaled"
      />
      <MilestoneTrack
        data={{ ...serpentineLeadTime, caption: 'labelPlacement="outside"' }}
        layout="serpentine"
        bubbleSizing="scaled"
        labelPlacement="outside"
      />
    </div>
  ),
};

/**
 * Job: Reveal State — the same single pipeline wrapped into per-sub-system rows
 * (serpentine), with capsule height scaled to each interval's share so the worst
 * bottleneck reads biggest; the danger capsule on the row break is the
 * cross-system handoff wait.
 */
export const Serpentine: Story = {
  args: { data: serpentineLeadTime, layout: 'serpentine', bubbleSizing: 'scaled' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const big = canvas.getByRole('button', {
      name: 'Project → first invoice: 26.3 d, 427 completed',
    });
    await expect(big.style.height).toBe('128px');
    await expect(canvasElement.querySelectorAll('.tcl-milestone-track__connector')).toHaveLength(2);
    await expect(canvasElement.querySelectorAll('.tcl-milestone-track__arrow')).toHaveLength(1);
  },
};

/**
 * Job: Reveal State — the same pipeline wrapped so every row READS LEFT-TO-RIGHT:
 * instead of a serpentine U-turn, a single carriage-return connector runs out to
 * the right margin, back across the full width, and down into the next row's
 * lead-in (left-chevrons mark it as a return, not forward flow).
 */
export const Wrap: Story = {
  args: { data: serpentineLeadTime, layout: 'wrap', bubbleSizing: 'scaled' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Three groups → three rows → two returns.
    await expect(canvasElement.querySelectorAll('.tcl-milestone-track__connector')).toHaveLength(2);
    // The point of `wrap`: EVERY row flows rightward. Under serpentine this row
    // would be mirrored and the comparison would invert.
    const left = (name: RegExp) =>
      Number.parseFloat(canvas.getByRole('button', { name }).style.left);
    await expect(left(/^Ticket created/)).toBeLessThan(left(/^Project created/));
    await expect(left(/^First role/)).toBeLessThan(left(/^First invoice/));
  },
};

/**
 * Job: Reveal State — `rowLength` wraps a track that has NO groups: the only way
 * to break an ungrouped pipeline into rows, applied within each group run.
 */
export const WrapByRowLength: Story = {
  args: {
    data: {
      ...release,
      title: 'Release pipeline, two stations per row',
      caption: 'rowLength={2} — carriage-return rows without any groups',
    },
    layout: 'wrap',
    rowLength: 2,
  },
};

/** Job: Acknowledge Input — selecting a stop paints the ring and the aria-live inspector announces it. */
export const Interaction: Story = {
  args: { data: leadTime, defaultSelectedId: 'project-invoice' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bubble = canvas.getByRole('button', {
      name: 'Ticket → project: 2.6 d, 605 completed',
    });
    await userEvent.click(bubble);
    await expect(bubble).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/9% of measured lead time/)).toBeInTheDocument();
  },
};
