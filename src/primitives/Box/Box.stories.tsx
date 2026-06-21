import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from './Box';

const meta = {
  title: 'Primitives/Box',
  component: Box,
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof Box>;

export const Default: Story = {
  render: () => (
    <Box surface="raised" border radius="lg" p={6} style={{ maxWidth: 320 }}>
      A Surface — a bounded region with padding, radius, border, and elevation.
    </Box>
  ),
};

export const Surfaces: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {(['raised', 'sunken', 'overlay'] as const).map((s) => (
        <Box key={s} surface={s} border radius="md" p={5}>
          {s}
        </Box>
      ))}
    </div>
  ),
};
