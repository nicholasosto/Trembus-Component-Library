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

/**
 * A lead-time rail: milestones as stations on one horizontal line, with the rail
 * swelling into a measured **interval bubble** wherever a station pair carries a
 * metric — value, sample count, and a share-of-total meter so a 26 d interval
 * reads bigger than a 2.6 d one. Source-system bands sit above the rail, handoff
 * dividers mark the seams between them, and pending stations dash their segments.
 *
 * ### When to use it
 * - Stage-to-stage lead/cycle time along ONE pipeline — opportunity → invoice,
 *   commit → deploy — where the durations BETWEEN milestones are the story.
 * - Not for actor handoffs (`Swimlane`), dated event chronicles (`Timeline`),
 *   stage-count conversion (`Funnel`), or branching pipelines (`@trembus/viz` `Lineage`).
 *
 * ### Data & key props
 * - `data.stations` — `{ id?, label, sub?, status?, badge?, note? }[]` in flow order;
 *   give stable `id`s (fallback is the index, never the label).
 * - `data.metrics` — `{ from, to, value, label?, count?, tone?, unit?, note? }[]`;
 *   `from`/`to` match a station `id` or `label` and may span several stations — the
 *   bubble takes the last free gap before `to` and a dotted whisker underlines the
 *   full measured span. One bubble per gap; invalid or negative metrics are skipped.
 * - `data.groups` — `{ label, glyph?, from, to }[]` source-system bands; glyph names
 *   come from the `@trembus/icons` registry.
 * - `data.unit` (default `d`) formats values; the header meta defaults to the summed
 *   total (e.g. "28.9 d measured") when units are uniform.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — controlled or uncontrolled selection.
 *
 * ### Accessibility
 * - Every station and bubble is a real `<button>` (`aria-pressed`) — stations are
 *   named "label — sub — status — badge — group", bubbles "label: value, count".
 * - Selection announces via the `aria-live` inspector (which also carries the
 *   share-of-total percentage); the rail SVG, bands, and meters are decorative
 *   (`aria-hidden`), and status is always paired with a word, never color alone.
 *
 * ### Theming & setup
 * - `--tcl-milestonetrack-accent` skins the rail chrome (read via fallback, never
 *   declared on the root); bubble tones use the status palette (default `warning`);
 *   accent painted as TEXT falls back to `--tcl-text` for AA. Works in light ·
 *   dark · reliquary via `[data-theme]`.
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

/** Job: Reveal State — statuses (complete / in progress / pending), per-interval tones, share meters, and the empty state. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <MilestoneTrack data={release} />
      <MilestoneTrack data={{ title: 'Unconfigured pipeline', stations: [] }} />
    </div>
  ),
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
