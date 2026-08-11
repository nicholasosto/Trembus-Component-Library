import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Nebula } from './Nebula';
import type { NebulaContract } from './Nebula';

// A REAL concept space: the user-facing Knowledge-Architectures workspace —
// the brain ontology (KOS Type) with its versioned contracts, the authoritative
// glossary that forms the common language between humans and LLM agents, the
// system verbs that operate on graphs, the note-kind taxonomy, three registered
// brain instances, and live notes sampled from graphs/artificial-brain/.
// Link weights follow the workspace's own Link Grading tiers (1.0 / .75 / .5 / .25).
const knowledgeArchitecture: NebulaContract = {
  brand: 'Knowledge Architectures',
  code: 'framework.three-layers',
  title: 'Ontology vs the artificial brain',
  caption:
    'Closeness = relatedness. The Type layer is the ontology; artificial-brain is its flagship instance — near-synonyms in conversation, distinct regions in space.',
  items: [
    {
      id: 'kos-type-brain',
      label: 'Brain (KOS Type)',
      group: 'type-layer',
      weight: 0.9,
      summary: 'The meta-pattern — defines what makes a brain a brain; the ontology itself.',
    },
    {
      id: 'brain-contract-v1-1',
      label: 'brain/v1.1 contract',
      group: 'type-layer',
      summary: 'Prior contract version; superseded 2026-06-21.',
    },
    {
      id: 'brain-contract-v1-2',
      label: 'brain/v1.2 contract',
      group: 'type-layer',
      weight: 0.7,
      summary:
        'Current RFC-2119 contract: promotes convergent fields, recognizes the partition axis.',
    },
    {
      id: 'vocabulary-glossary',
      label: 'Glossary (00-vocabulary)',
      group: 'type-layer',
      weight: 0.8,
      summary: 'Authoritative glossary — the common language between individuals and LLMs.',
    },
    {
      id: 'frontmatter-spec',
      label: 'frontmatter.md',
      group: 'type-layer',
      summary: 'Field-by-field spec of required and instance-declared YAML frontmatter.',
    },
    {
      id: 'primitives-spec',
      label: 'primitives.md',
      group: 'type-layer',
      summary: 'Behavioral guarantees every brain must implement.',
    },
    {
      id: 'extension-points',
      label: 'extension-points.md',
      group: 'type-layer',
      summary: 'The 8 declared variation axes brains may extend along.',
    },
    {
      id: 'capture',
      label: 'capture',
      group: 'system-verbs',
      summary: 'Required verb: routes wound to scar, concept to engram; applies curation scoring.',
    },
    {
      id: 'recall',
      label: 'recall',
      group: 'system-verbs',
      summary: 'Required verb: retrieves neighborhoods, searches aliases, surfaces scars first.',
    },
    {
      id: 'health',
      label: 'health',
      group: 'system-verbs',
      summary:
        'Required verb: detects plasticity violations, reciprocity drift, conformance failures.',
    },
    {
      id: 'learn',
      label: 'learn',
      group: 'system-verbs',
      summary: 'Recommended verb: researches external sources into Neural Notes.',
    },
    {
      id: 'brain-dream',
      label: 'brain-dream',
      group: 'system-verbs',
      summary: 'Extension verb: generates Dream notes from cross-domain collisions.',
    },
    {
      id: 'engram',
      label: 'Engram',
      group: 'note-kinds',
      weight: 0.75,
      summary: 'Atomic concept note — the graph’s basic unit.',
    },
    {
      id: 'circuit',
      label: 'Circuit',
      group: 'note-kinds',
      summary: 'Relationship map showing how engrams interconnect; a hub note.',
    },
    {
      id: 'cortex',
      label: 'Cortex',
      group: 'note-kinds',
      summary: 'Project-level cluster — a brain region spanning many engrams and circuits.',
    },
    {
      id: 'trace',
      label: 'Trace',
      group: 'note-kinds',
      summary: 'Working memory — consolidates into an engram or decays within 7 days.',
    },
    {
      id: 'reflex',
      label: 'Reflex',
      group: 'note-kinds',
      summary: 'Designed SOP/template — fast, no deliberation.',
    },
    {
      id: 'scar',
      label: 'Scar',
      group: 'note-kinds',
      summary: 'A lesson from a real failure, carrying trigger_pattern and severity.',
    },
    {
      id: 'dream-note',
      label: 'Dream (note)',
      group: 'note-kinds',
      summary: 'Cross-domain speculative note — high novelty, low coherence.',
    },
    {
      id: 'activation',
      label: 'Activation',
      group: 'lifecycle-terms',
      summary: 'Referencing a note increments activation_count and stamps last_activated.',
    },
    {
      id: 'plasticity',
      label: 'Plasticity',
      group: 'lifecycle-terms',
      summary: 'Malleability ladder derived from activation_count.',
    },
    {
      id: 'myelination',
      label: 'Myelination',
      group: 'lifecycle-terms',
      summary: 'Promotion to a mature, fast-access primitive at sustained activation.',
    },
    {
      id: 'curation-scoring',
      label: 'Curation Scoring',
      group: 'lifecycle-terms',
      summary: 'A −3..+3 gate before note creation; only +3 becomes an engram.',
    },
    {
      id: 'link-grading',
      label: 'Link Grading',
      group: 'lifecycle-terms',
      summary: '4-tier reciprocity model; the source of this map’s link weights.',
    },
    {
      id: 'artificial-brain',
      label: 'artificial-brain',
      group: 'instances',
      weight: 1,
      summary: 'Flagship instance: 457 notes, extended conformance, cognitive agents.',
    },
    {
      id: 'roblox-brain',
      label: 'roblox-brain',
      group: 'instances',
      summary: 'Instance hosted by roblox-dev: 190 notes, verification + deprecation tracking.',
    },
    {
      id: 'lore-brain',
      label: 'lore-brain',
      group: 'instances',
      summary: 'Its reality partition field was the prototype for v1.2’s partition axis.',
    },
    {
      id: 'mark-ui-primitive',
      label: 'Mark — UI Primitive',
      group: 'graph-notes',
      summary: 'Real engram: the second irreducible UI primitive — anything drawn on a Surface.',
    },
    {
      id: 'ontological-positions',
      label: 'Ontological Positions',
      group: 'graph-notes',
      summary: 'Real circuit: monism, dualism, and pluralism under Metaphysics.',
    },
    {
      id: 'primitives-color-ontology',
      label: 'Primitives as Color-Coded Ontology',
      group: 'graph-notes',
      summary: 'Real dream note: two independently-built color-token ontologies collide.',
    },
  ],
  links: [
    {
      source: 'brain-contract-v1-1',
      target: 'brain-contract-v1-2',
      kind: 'versioned-by',
      weight: 0.95,
    },
    { source: 'kos-type-brain', target: 'brain-contract-v1-2', kind: 'part-of', weight: 0.9 },
    { source: 'frontmatter-spec', target: 'brain-contract-v1-2', kind: 'part-of', weight: 0.85 },
    { source: 'primitives-spec', target: 'brain-contract-v1-2', kind: 'part-of', weight: 0.85 },
    { source: 'extension-points', target: 'brain-contract-v1-2', kind: 'part-of', weight: 0.8 },
    { source: 'vocabulary-glossary', target: 'kos-type-brain', kind: 'defines', weight: 0.75 },
    { source: 'vocabulary-glossary', target: 'engram', kind: 'defines', weight: 0.65 },
    { source: 'vocabulary-glossary', target: 'activation', kind: 'defines', weight: 0.7 },
    { source: 'vocabulary-glossary', target: 'myelination', kind: 'defines', weight: 0.7 },
    { source: 'vocabulary-glossary', target: 'scar', kind: 'defines', weight: 0.6 },
    { source: 'artificial-brain', target: 'brain-contract-v1-2', kind: 'conforms-to', weight: 0.9 },
    { source: 'roblox-brain', target: 'brain-contract-v1-2', kind: 'conforms-to', weight: 0.9 },
    { source: 'lore-brain', target: 'brain-contract-v1-1', kind: 'conforms-to', weight: 0.8 },
    { source: 'lore-brain', target: 'brain-contract-v1-2', kind: 'links-to', weight: 0.6 },
    { source: 'kos-type-brain', target: 'artificial-brain', kind: 'near-synonym', weight: 0.55 },
    { source: 'capture', target: 'engram', kind: 'operates-on', weight: 0.8 },
    { source: 'capture', target: 'trace', kind: 'operates-on', weight: 0.7 },
    { source: 'capture', target: 'curation-scoring', kind: 'operates-on', weight: 0.75 },
    { source: 'recall', target: 'scar', kind: 'operates-on', weight: 0.85 },
    { source: 'recall', target: 'engram', kind: 'operates-on', weight: 0.7 },
    { source: 'recall', target: 'activation', kind: 'operates-on', weight: 0.7 },
    { source: 'health', target: 'plasticity', kind: 'operates-on', weight: 0.85 },
    { source: 'health', target: 'link-grading', kind: 'operates-on', weight: 0.6 },
    { source: 'learn', target: 'engram', kind: 'operates-on', weight: 0.65 },
    { source: 'brain-dream', target: 'dream-note', kind: 'operates-on', weight: 0.9 },
    { source: 'dream-note', target: 'brain-dream', kind: 'near-synonym', weight: 0.75 },
    { source: 'activation', target: 'plasticity', kind: 'links-to', weight: 0.9 },
    { source: 'plasticity', target: 'myelination', kind: 'links-to', weight: 0.85 },
    { source: 'myelination', target: 'activation', kind: 'links-to', weight: 0.8 },
    { source: 'curation-scoring', target: 'trace', kind: 'links-to', weight: 0.7 },
    { source: 'link-grading', target: 'circuit', kind: 'links-to', weight: 0.6 },
    { source: 'scar', target: 'reflex', kind: 'conforms-to', weight: 0.9 },
    { source: 'trace', target: 'engram', kind: 'links-to', weight: 0.7 },
    { source: 'circuit', target: 'engram', kind: 'links-to', weight: 0.75 },
    { source: 'cortex', target: 'circuit', kind: 'links-to', weight: 0.7 },
    { source: 'dream-note', target: 'engram', kind: 'links-to', weight: 0.5 },
    { source: 'mark-ui-primitive', target: 'engram', kind: 'conforms-to', weight: 0.85 },
    { source: 'ontological-positions', target: 'circuit', kind: 'conforms-to', weight: 0.85 },
    {
      source: 'primitives-color-ontology',
      target: 'dream-note',
      kind: 'conforms-to',
      weight: 0.85,
    },
    {
      source: 'primitives-color-ontology',
      target: 'mark-ui-primitive',
      kind: 'links-to',
      weight: 0.8,
    },
    { source: 'artificial-brain', target: 'mark-ui-primitive', kind: 'links-to', weight: 0.75 },
    { source: 'artificial-brain', target: 'ontological-positions', kind: 'links-to', weight: 0.75 },
    {
      source: 'artificial-brain',
      target: 'primitives-color-ontology',
      kind: 'links-to',
      weight: 0.8,
    },
    { source: 'roblox-brain', target: 'engram', kind: 'links-to', weight: 0.6 },
  ],
  groups: {
    'type-layer': { label: 'Type layer (spec)', tone: 'accent' },
    'system-verbs': { label: 'System verbs', tone: 'info' },
    'note-kinds': { label: 'Note kinds (graph)', tone: 'success' },
    'lifecycle-terms': { label: 'Lifecycle vocabulary', tone: 'warning' },
    instances: { label: 'Brain instances', tone: 'danger' },
    'graph-notes': { label: 'Live graph notes', tone: 'neutral' },
  },
};

// The library's own doctrine as a small dense space — every pair linked, so
// `showEdges="all"` stays readable.
const uiDoctrine: NebulaContract = {
  code: 'vault.first-principles.ui',
  title: 'The three UI jobs',
  items: [
    { id: 'surface', label: 'Surface', group: 'primitives', summary: 'Somewhere to exist.' },
    { id: 'mark', label: 'Mark', group: 'primitives', summary: 'Anything drawn on a Surface.' },
    { id: 'state', label: 'State', group: 'primitives', summary: 'The system’s memory of now.' },
    {
      id: 'affordance',
      label: 'Affordance',
      group: 'primitives',
      summary: 'An invitation to act.',
    },
    { id: 'reveal', label: 'Reveal State', group: 'jobs', summary: 'Make what IS perceivable.' },
    {
      id: 'afford',
      label: 'Afford Action',
      group: 'jobs',
      summary: 'Make what COULD BE discoverable.',
    },
    {
      id: 'ack',
      label: 'Acknowledge Input',
      group: 'jobs',
      summary: 'Make what JUST HAPPENED undeniable.',
    },
    {
      id: 'button',
      label: 'Button',
      group: 'components',
      weight: 0.9,
      summary: 'All three jobs in 40px.',
    },
  ],
  links: [
    { source: 'reveal', target: 'surface', weight: 0.8 },
    { source: 'reveal', target: 'mark', weight: 0.85 },
    { source: 'reveal', target: 'state', weight: 0.9 },
    { source: 'afford', target: 'affordance', weight: 0.9 },
    { source: 'ack', target: 'state', weight: 0.85 },
    { source: 'ack', target: 'affordance', weight: 0.7 },
    { source: 'button', target: 'reveal', weight: 0.75 },
    { source: 'button', target: 'afford', weight: 0.85 },
    { source: 'button', target: 'ack', weight: 0.8 },
  ],
  groups: {
    primitives: { label: 'Primitives', tone: 'info' },
    jobs: { label: 'UI jobs', tone: 'accent' },
    components: { label: 'Components', tone: 'success' },
  },
};

// Consumer-given coordinates (e.g. offline embeddings reduced to 3D) — the
// component only normalizes, rotates, and projects.
const givenSpace: NebulaContract = {
  title: 'Given coordinates',
  caption: 'layout: "given" — positions come from the consumer (any scale).',
  layout: 'given',
  items: [
    { id: 'north', label: 'North', group: 'axes', position: [0, 1, 0] },
    { id: 'south', label: 'South', group: 'axes', position: [0, -1, 0] },
    { id: 'east', label: 'East', group: 'axes', position: [1, 0, 0] },
    { id: 'west', label: 'West', group: 'axes', position: [-1, 0, 0] },
    { id: 'core', label: 'Core', group: 'center', weight: 1, position: [0, 0, 0] },
    { id: 'zenith', label: 'Zenith', group: 'axes', position: [0, 0, 1] },
  ],
  groups: {
    axes: { label: 'Axes', tone: 'info' },
    center: { label: 'Center', tone: 'accent' },
  },
};

/**
 * A 3D concept map where DISTANCE is the message: items embed in 3D space by
 * weighted relatedness (deterministic classical MDS — no randomness, same input,
 * same map), groups tint shared cloud regions, and the whole space rotates under
 * drag, arrow keys, or an opt-in idle orbit. Depth reads through scale and fade;
 * selection reveals an item's relation threads and its ranked nearest neighbors.
 *
 * ### When to use it
 * - "How close are these concepts, really?" — glossaries vs ontologies, semantic
 *   neighborhoods, embedding spaces, any grouped-and-related list where proximity
 *   carries the insight and edges alone would hairball.
 * - Not for strict hierarchy → `Tree`; not for directed flow/DAGs → `Lineage`; not
 *   for "what rests on what" → `Strata`; not for a ≤6-satellite overview → ui `Hub`;
 *   not for nested containers → `SystemMap`.
 *
 * ### Data & key props
 * - `data.items` — `{ id, label, group?, summary?, weight?, tone?, position? }`
 *   (`id` REQUIRED + unique; `weight` 0..1 sizes the node).
 * - `data.links` — `{ source, target, weight?, kind? }`; weight 0..1 is relatedness
 *   (higher = closer). Dangling/self references are dropped silently.
 * - `data.layout: 'given'` uses `item.position` (any scale; normalized) — the path
 *   for offline embeddings. Default `'auto'` embeds from the links.
 * - `showEdges` — `'selected'` (default) | `'all'` | `'none'`.
 * - Proximity is RELATIVE — the embedding normalizes to the unit sphere, so a
 *   sparse map spreads as wide as a dense one; absolute weights live in the
 *   inspector's neighbor readout.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — the selection trio;
 *   `autoOrbit` adds a slow idle spin with a real pause button.
 *
 * ### Accessibility
 * - The 3D scene (edges, clouds) is `aria-hidden` decoration; every item is a real
 *   focusable HTML `<button>` with Arrow/Home/End roving (Up/Down jump groups).
 * - The `aria-live` inspector names the selected item's nearest neighbors WITH
 *   weights — the textual equivalent of proximity, rotation-invariant.
 * - `autoOrbit` is suppressed under `prefers-reduced-motion` and pausable via a
 *   visible `aria-pressed` button; drag rotation is user-driven and always works.
 *
 * ### Theming & setup
 * - Group tones tint clouds, node dots, and legend chips — always paired with the
 *   group word; node text stays `--tcl-text` at every depth.
 * - Setup: import `@trembus/viz/styles.css` once at the app root (it carries the full
 *   tokens foundation). `@trembus/viz` depends only on `@trembus/tokens` — no ui needed.
 */
const meta = {
  title: 'Visualizations/Nebula',
  component: Nebula,
  args: { data: knowledgeArchitecture, defaultSelectedId: 'artificial-brain' },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 760, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Nebula>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — every concept is a focusable button in a draggable space;
 * the selected instance shows its relation threads, and "ontology vs the
 * artificial brain" reads as literal distance. */
export const Default: Story = {};

/** Job: Reveal State — a dense fully-linked space with every edge drawn, and a
 * consumer-given coordinate space (offline embeddings) with clouds only. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <Nebula data={uiDoctrine} showEdges="all" defaultSelectedId="button" />
      <Nebula data={givenSpace} showEdges="none" />
    </div>
  ),
};

/** Job: Acknowledge Input — selection rings the node, reveals its threads, and the
 * aria-live inspector announces the datum with ranked nearest neighbors; the
 * idle orbit ships with a real pause control. */
export const Interaction: Story = {
  args: { data: knowledgeArchitecture, autoOrbit: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // NOT the meta's defaultSelectedId (artificial-brain) — this node arrives unselected.
    const node = canvas.getByRole('button', { name: 'Brain (KOS Type), Type layer (spec)' });
    await expect(node).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(node);
    await expect(node).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/Closest:/)).toBeInTheDocument();
    // The ontology's summary is announced in the aria-live inspector.
    await expect(canvas.getByText(/The meta-pattern/)).toBeInTheDocument();
    // Keyboard rotation parity + reset live on a real control.
    await expect(canvas.getByRole('button', { name: /^Reset view/ })).toBeInTheDocument();
  },
};
