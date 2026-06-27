import type { Meta, StoryObj } from '@storybook/react-vite';
import { GLYPHS, Glyph } from './glyphs';

// A gallery of the in-repo glyph set (the seed of a future @trembus/icons). Not a
// library component — just a visual index of every registered glyph.
function Gallery() {
  const names = Object.keys(GLYPHS);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))',
        gap: 12,
        fontFamily: 'var(--tcl-font-sans)',
        color: 'var(--tcl-text)',
      }}
    >
      {names.map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '14px 8px',
            border: '0.5px solid var(--tcl-border)',
            borderRadius: 'var(--tcl-radius-md)',
            background: 'var(--tcl-surface-raised)',
          }}
        >
          <span style={{ fontSize: 26, lineHeight: 1, color: 'var(--tcl-text)' }}>
            <Glyph name={name} />
          </span>
          <code style={{ fontSize: 11, color: 'var(--tcl-text-dim)' }}>{name}</code>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: 'Foundations/Glyphs',
  component: Gallery,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every registered glyph — monochrome marks inherit `currentColor`; type marks carry brand color. */
export const Default: Story = {};
