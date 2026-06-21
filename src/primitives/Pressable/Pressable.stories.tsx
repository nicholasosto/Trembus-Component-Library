import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Pressable } from './Pressable';

const demoStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: 5,
  border: '1px solid var(--tcl-border-strong)',
  background: 'var(--tcl-surface-raised)',
  color: 'var(--tcl-text)',
};

const meta = {
  title: 'Primitives/Pressable',
  component: Pressable,
  args: { onPress: fn() },
} satisfies Meta<typeof Pressable>;

export default meta;
type Story = StoryObj<typeof Pressable>;

/** Renders a real <button> and owns the Affordance state machine (data-state). */
export const Default: Story = {
  render: (args) => (
    <Pressable {...args} style={demoStyle}>
      Press me
    </Pressable>
  ),
};

/** `asChild` lends the affordance behavior to your own element (here, a link). */
export const AsChildLink: Story = {
  render: (args) => (
    <Pressable {...args} asChild>
      <a href="#example" style={{ ...demoStyle, textDecoration: 'none' }}>
        I am a link with button behavior
      </a>
    </Pressable>
  ),
};
