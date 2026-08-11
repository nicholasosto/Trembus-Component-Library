import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Assay } from './Assay';
import type { AssayContract } from './Assay';

// The motivating rubric, verbatim from Knowledge Architectures: Curation Scoring
// (brain/v1.2 primitives §4) weighs reference density, distinctness, cross-domain
// bridging, and internal structure into a −3..+3 verdict — and the spec REQUIRES
// the derivation to be visible "so the user can see why a candidate was admitted,
// traced, or rejected". Candidates are real capture decisions.
const curation: AssayContract = {
  brand: 'Knowledge Architectures',
  code: 'brain.primitives.curation',
  title: 'Engram capture value',
  caption:
    'Track length is the criterion’s weight; the fill is its score — ink equals contribution.',
  criteria: [
    { id: 'density', label: 'reference density', weight: 0.3 },
    { id: 'distinct', label: 'distinctness', weight: 0.25 },
    { id: 'bridging', label: 'cross-domain bridging', weight: 0.25 },
    { id: 'structure', label: 'internal structure', weight: 0.2 },
  ],
  candidates: [
    {
      id: 'primitives-color-ontology',
      label: 'Primitives as color-coded ontology',
      sub: 'dream',
      summary:
        'Two independently-built color-token ontologies collide — bridges UI and metaphysics.',
      scores: { density: 0.95, distinct: 0.9, bridging: 1, structure: 0.85 },
    },
    {
      id: 'stagger-severs',
      label: 'Stagger severs orchestration',
      sub: 'motion spike',
      summary:
        'A child that drives itself breaks stagger orchestration — promising, needs validation.',
      scores: { density: 0.75, distinct: 0.85, bridging: 0.75, structure: 0.8 },
    },
    {
      id: 'cframe-basics',
      label: 'CFrame basics',
      sub: 'roblox',
      summary: 'Well-referenced but near-duplicates the existing CFrame engram.',
      scores: { density: 0.8, distinct: 0.4, bridging: 0.2, structure: 0.6 },
      penalties: [{ label: 'duplicate of existing', value: 0.8 }],
    },
    {
      id: 'files-have-names',
      label: 'Files have names',
      sub: 'generic',
      summary:
        'A generic principle with no internal structure — the rubric exists to keep this out.',
      scores: { density: 0.3, distinct: 0.1, bridging: 0.05, structure: 0.2 },
    },
  ],
  scale: {
    min: -3,
    max: 3,
    bands: [
      { upTo: 0, label: 'skip', tone: 'danger' },
      { upTo: 1.5, label: 'inline', tone: 'neutral' },
      { upTo: 2.5, label: 'trace', tone: 'warning' },
      { label: 'engram', tone: 'success' },
    ],
  },
  rubricNote: 'rubric brain/v1.2 · §4 curation scoring',
};

// One candidate → the detail card. A different domain (release readiness, 0..10)
// with deliberately un-normalized weights (Σ 10) — the footer discloses it.
const releaseReadiness: AssayContract = {
  code: 'tcl.release.readiness',
  title: 'Release readiness — @trembus/viz 0.6.0',
  criteria: [
    { id: 'gate', label: 'validate gate green', weight: 4 },
    { id: 'themes', label: 'both themes verified', weight: 3 },
    { id: 'docs', label: 'docs layers complete', weight: 2 },
    { id: 'changelog', label: 'changelog entry', weight: 1 },
  ],
  candidates: [
    {
      id: 'nebula',
      label: 'Nebula',
      sub: 'viz',
      summary: 'Full quality loop run: gates green, adversarial review findings fixed with tests.',
      scores: { gate: 1, themes: 1, docs: 0.9, changelog: 0.5 },
    },
  ],
  scale: {
    min: 0,
    max: 10,
    bands: [
      { upTo: 4, label: 'hold', tone: 'danger' },
      { upTo: 7, label: 'polish', tone: 'warning' },
      { label: 'ship', tone: 'success' },
    ],
  },
};

// No scale/bands at all → plain 0..1 weighted totals, no verdict chips.
const toolPick: AssayContract = {
  title: 'Diagram layout engine',
  criteria: [
    { id: 'quality', label: 'layout quality', weight: 0.5 },
    { id: 'size', label: 'bundle size', weight: 0.3 },
    { id: 'types', label: 'type support', weight: 0.2 },
  ],
  candidates: [
    { id: 'dagre', label: '@dagrejs/dagre', scores: { quality: 0.8, size: 0.7, types: 0.9 } },
    { id: 'elk', label: 'elkjs', scores: { quality: 0.95, size: 0.2, types: 0.6 } },
    { id: 'hand', label: 'hand-rolled', scores: { quality: 0.5, size: 1, types: 1 } },
  ],
};

/**
 * A weighted-rubric evaluation. Each criterion's track is sized by its WEIGHT and
 * filled by its SCORE, so inked length is literal contribution — the weighted
 * math is visible geometry, not a footnote. Penalties claw points back in danger
 * red, totals land on a banded verdict scale (skip / inline / trace / engram, or
 * any bands you define), and the card footer prints the equation. One candidate
 * renders the detail card; several render a ranked board where selecting a row
 * assays it — the inspector IS the card.
 *
 * ### When to use it
 * - Any weighted-criteria decision where the "why" must be visible: capture
 *   curation (engram value potential), vendor/tool selection, hiring rubrics,
 *   RFC scoring, release readiness.
 * - Not for plain series magnitude → `BarChart`; not for one KPI → `Stat` /
 *   `Gauge`; not for stage drop-off → `Funnel`; not for spending a budget
 *   against prerequisites → viz `TalentTree`.
 *
 * ### Data & key props
 * - `data.criteria` — `{ id, label, weight, tone? }` (`id` REQUIRED + unique).
 *   Weights are relative and normalized internally to Σ 1; when the authored sum
 *   isn't 1 the card footer discloses `(normalized)` — never silent.
 * - `data.candidates` — `{ id, label, sub?, summary?, scores, penalties? }`;
 *   `scores` maps criterion id → 0..1 (missing → 0). `penalties` subtract scale
 *   units after the weighted sum and always paint `danger`.
 * - `data.scale` — `{ min, max, bands? }`; bands are ordered verdict gates
 *   (`upTo` omitted on the last). Omit `scale` for plain 0..1 totals.
 * - One candidate → detail card; several → ranked board + selected card.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — the selection trio.
 *
 * ### Accessibility
 * - Board rows are real focusable HTML `<button>`s with Arrow/Home/End roving
 *   (selection follows focus); the decorative bars carry no semantics.
 * - An `aria-live` line announces the assayed candidate's label, total, verdict,
 *   and penalties; verdict tones are always paired with the verdict word.
 * - The equation footer makes the math screen-reader-legible, not just visual.
 *
 * ### Theming & setup
 * - Criterion tones default to a cycle that reserves `danger` for penalties;
 *   verdict chips use the AA-tuned status tints (`accent`-as-text maps to
 *   `--tcl-text`, the Badge rule).
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Visualizations/Assay',
  component: Assay,
  args: { data: curation, defaultSelectedId: 'primitives-color-ontology' },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 720, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Assay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — every candidate is a focusable ranked row; pressing one
 * assays it, and the detail card below is the inspector. */
export const Default: Story = {};

/** Job: Reveal State — the n=1 detail card on a custom 0..10 scale with
 * un-normalized weights disclosed in the footer, and a band-less board where
 * totals stand alone. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <Assay data={releaseReadiness} />
      <Assay data={toolPick} defaultSelectedId="hand" />
    </div>
  ),
};

/** Job: Acknowledge Input — assaying a penalized candidate rings its row and the
 * aria-live line announces total, verdict, and the clawback with its reason. */
export const Interaction: Story = {
  args: { data: curation },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole('button', { name: /CFrame basics/ });
    await expect(row).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(row);
    await expect(row).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/Penalty −0\.8: duplicate of existing/)).toBeInTheDocument();
    // The verdict is words + tone, and the equation is printed in the card foot.
    await expect(canvas.getAllByText('skip').length).toBeGreaterThan(0);
    await expect(canvas.getByText(/weights Σ 1\.00/)).toBeInTheDocument();
  },
};
