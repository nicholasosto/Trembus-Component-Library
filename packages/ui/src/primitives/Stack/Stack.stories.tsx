import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '../Box/Box';
import { Inline, Stack } from './Stack';

/**
 * The RELATION primitives — `Stack` (column) and its row twin `Inline`, exported from
 * the same module — put SPACE between children on the token scale instead of ad-hoc
 * margins: `gap` steps, `align` / `justify`, optional `wrap`. Both extend `Box`, so
 * the surface / padding / radius vocabulary rides along.
 *
 * ### When to use it
 * - Any time you'd hand-write flexbox for rhythm: form rows, toolbars, page columns.
 * - Not for two-dimensional layouts — bring CSS grid in your own chrome (Box accepts
 *   `style`) or use a composed component.
 *
 * ### Data & key props
 * - `gap` — the space step between children (steps, never pixels).
 * - `align` (cross-axis) · `justify` (main-axis) · `wrap`.
 * - Everything from `Box`: `surface`, padding steps, `radius`, `border`, and
 *   polymorphic `as`.
 *
 * ### Accessibility
 * - Layout only — no roles; semantics come from `as` and the children.
 *
 * ### Theming & setup
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full
 *   tokens foundation).
 */
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

/** Stack — column rhythm from the gap scale alone. */
export const VerticalStack: Story = {
  render: () => (
    <Stack gap={3} style={{ maxWidth: 240 }}>
      <Item>One</Item>
      <Item>Two</Item>
      <Item>Three</Item>
    </Stack>
  ),
};

/** Inline — the same relation as a row (`align` keeps the boxes on one line). */
export const HorizontalInline: Story = {
  render: () => (
    <Inline gap={3} align="center">
      <Item>One</Item>
      <Item>Two</Item>
      <Item>Three</Item>
    </Inline>
  ),
};
