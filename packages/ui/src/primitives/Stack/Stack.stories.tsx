import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '../Box/Box';
import { Inline, Stack } from './Stack';

const meta = {
  title: 'Primitives/Stack',
  component: Stack,
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof Stack>;

const Item = ({ children }: { children: React.ReactNode }) => (
  <Box surface="raised" border radius="md" p={4}>
    {children}
  </Box>
);

export const VerticalStack: Story = {
  render: () => (
    <Stack gap={3} style={{ maxWidth: 240 }}>
      <Item>One</Item>
      <Item>Two</Item>
      <Item>Three</Item>
    </Stack>
  ),
};

export const HorizontalInline: Story = {
  render: () => (
    <Inline gap={3} align="center">
      <Item>One</Item>
      <Item>Two</Item>
      <Item>Three</Item>
    </Inline>
  ),
};
