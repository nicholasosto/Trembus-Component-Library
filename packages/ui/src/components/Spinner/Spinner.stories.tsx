import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    tone: {
      control: 'select',
      options: ['current', 'accent', 'neutral', 'success', 'info', 'warning', 'danger'],
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — a busy indicator. */
export const Default: Story = { args: { tone: 'accent' } };

/** Job: Afford Action — the size scale. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', color: 'var(--tcl-accent)' }}>
      {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <Spinner key={s} size={s} />
      ))}
    </div>
  ),
};

/** Job: Acknowledge Input — tones (the color-coded ontology). */
export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      {(['accent', 'success', 'info', 'warning', 'danger'] as const).map((t) => (
        <Spinner key={t} tone={t} />
      ))}
    </div>
  ),
};
