import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button';
import { Card } from './Card';

/**
 * A raised grouping surface that makes related content read as one unit, with a
 * compound section API (`Card.Header` / `Card.Body` / `Card.Footer`). Lead job is
 * **reveal state** — the grouping itself; any actions live in its children.
 *
 * ### When to use it
 * - Grouping a coherent chunk of a page: a summary, a form section, a preview
 *   tile with its actions in the footer.
 * - A Card grid that wants sorting/filtering wanted to be a `Table`.
 * - For a scene-setting skinned surface (glass, relic, …) use `Box` with
 *   `material` — Card is the plain raised workhorse.
 *
 * ### Data & key props
 * - Compound parts: `Card.Header` (lead line) · `Card.Body` (content) ·
 *   `Card.Footer` (actions row); compose any subset.
 * - `interactive` — adds a hover-lift affordance; pair it with an interactive
 *   child or wrap the card in a link — the card itself never becomes focusable.
 * - Root and sections accept all `<div>` props (`style`, `onClick`, …).
 *
 * ### Accessibility
 * - A static `<div>` surface with no role — semantics come from its content
 *   (headings, buttons, links), which handles its own focus and input.
 * - `interactive` is visual only; keep a real focusable element inside so the
 *   affordance is reachable by keyboard.
 *
 * ### Theming & setup
 * - Surface, border, radius, and elevation come from `var(--tcl-surface-raised)`,
 *   `var(--tcl-border)`, `var(--tcl-radius-lg)`, `var(--tcl-elevation-1)`; works in
 *   light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — header/body/footer grouped on one surface. */
export const Default: Story = {
  render: () => (
    <Card style={{ maxWidth: 360 }}>
      <Card.Header>Delete project?</Card.Header>
      <Card.Body>
        This permanently removes the project and all of its data. This action cannot be undone.
      </Card.Body>
      <Card.Footer>
        <Button variant="ghost" tone="neutral">
          Cancel
        </Button>
        <Button tone="danger">Delete</Button>
      </Card.Footer>
    </Card>
  ),
};

/** Job: Afford Action — an interactive card with a hover affordance. */
export const Interactive: Story = {
  render: () => (
    <Card interactive style={{ maxWidth: 360 }}>
      <Card.Body>
        <strong>Trembus Visual Grammar</strong>
        <p style={{ margin: '4px 0 0', color: 'var(--tcl-text-dim)' }}>
          Hover me — interactive cards lift on hover.
        </p>
      </Card.Body>
    </Card>
  ),
};

/** Job: Acknowledge Input — section combinations. */
export const Sections: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
      <Card>
        <Card.Body>Body only.</Card.Body>
      </Card>
      <Card>
        <Card.Header>Header + body</Card.Header>
        <Card.Body>Some content.</Card.Body>
      </Card>
    </div>
  ),
};
