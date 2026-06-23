import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — placeholders for loading content. */
export const Default: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, width: 280 }}>
      <Skeleton variant="text" lines={3} />
    </div>
  ),
};

/** Job: Afford Action — the shape variants. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Skeleton variant="circle" width={48} height={48} />
      <Skeleton variant="rect" width={120} height={48} />
      <Skeleton variant="text" width={160} />
    </div>
  ),
};

/** Job: Acknowledge Input — composed into a card placeholder. */
export const Composed: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: 280 }}>
      <Skeleton variant="circle" width={40} height={40} />
      <div style={{ flex: 1, display: 'grid', gap: 8 }}>
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  ),
};
