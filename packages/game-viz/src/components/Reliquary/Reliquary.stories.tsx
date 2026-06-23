import type { Meta, StoryObj } from '@storybook/react-vite';
import { Reliquary } from './Reliquary';

// A stand-in "portrait" — a recessed plate with a faint radial bloom, so the
// frame has something cinematic to wrap without shipping an image asset.
function Portrait({ label = 'SUBJECT' }: { label?: string }) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 220,
        background:
          'radial-gradient(120% 110% at 50% 25%, color-mix(in oklab, var(--tcl-status-danger) 26%, var(--tcl-bg)) 0%, var(--tcl-bg) 72%)',
        color: 'var(--tcl-text-faint)',
        fontFamily: 'var(--tcl-font-mono)',
        fontSize: 'var(--tcl-text-xs)',
        letterSpacing: 'var(--tcl-tracking-caps)',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  );
}

const meta = {
  title: 'Game/Reliquary',
  component: Reliquary,
  parameters: { layout: 'padded' },
  args: { children: <Portrait /> },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Reliquary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — subject label/tag + tone-coded status readouts around a framed portrait. */
export const Default: Story = {
  args: {
    label: 'SUBJECT · 001',
    tag: 'THE KEPT KNIGHT',
    'aria-label': 'The Kept Knight reliquary',
    status: [
      { label: 'SOUL INTEGRITY — 34.7%', tone: 'danger' },
      { label: 'CONTAINMENT STABLE', tone: 'success' },
    ],
    children: <Portrait label="The Kept Knight" />,
  },
};

/** Job: Afford Action (presentational) — frame tones + status combinations; the frame itself affords nothing. */
export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '1.5rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      }}
    >
      <Reliquary
        tone="accent"
        label="SUBJECT · 002"
        tag="UNBOUND"
        status={[{ label: 'SIGNAL — NOMINAL', tone: 'accent' }]}
      >
        <Portrait label="II" />
      </Reliquary>
      <Reliquary
        tone="success"
        label="SUBJECT · 003"
        status={[{ label: 'CONTAINMENT STABLE', tone: 'success' }]}
      >
        <Portrait label="III" />
      </Reliquary>
      <Reliquary
        tone="warning"
        label="SUBJECT · 004"
        tag="VOLATILE"
        status={[
          { label: 'INTEGRITY — 12%', tone: 'danger' },
          { label: 'BREACH RISK', tone: 'warning' },
        ]}
      >
        <Portrait label="IV" />
      </Reliquary>
    </div>
  ),
};

/** Job: Acknowledge Input (presentational) — the frame wraps a real focusable control without interfering. */
export const Interaction: Story = {
  args: {
    label: 'SUBJECT · 001',
    tag: 'INTERACTIVE',
    'aria-label': 'Reliquary framing a play control',
    children: (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: 180 }}>
        <button
          type="button"
          style={{
            appearance: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--tcl-space-2)',
            padding: 'var(--tcl-space-3) var(--tcl-space-5)',
            font: 'inherit',
            fontFamily: 'var(--tcl-font-mono)',
            fontSize: 'var(--tcl-text-sm)',
            letterSpacing: 'var(--tcl-tracking-wide)',
            textTransform: 'uppercase',
            color: 'var(--tcl-accent-fg)',
            background: 'var(--tcl-accent)',
            border: 'none',
            borderRadius: 'var(--tcl-radius-sm)',
          }}
        >
          ▶ Watch
        </button>
      </div>
    ),
  },
};
