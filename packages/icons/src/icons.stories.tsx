import type { Meta, StoryObj } from '@storybook/react-vite';
import { GLYPHS, Glyph } from './index';

// A gallery of the shared glyph set. Not a library component — just a visual index
// of every registered glyph. The token CSS vars resolve from Storybook's globally
// loaded tokens stylesheet (the icons package itself ships no CSS / token dep).
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
  title: 'Foundations/Icons',
  component: Gallery,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every registered glyph — monochrome marks inherit `currentColor`; brand marks carry their own color. */
export const Default: Story = {};
