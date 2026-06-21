import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';

const meta = {
  title: 'Primitives/Text',
  component: Text,
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof Text>;

export const Scale: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Text as="h1" size="xl" weight="bold">
        Display / xl
      </Text>
      <Text as="h2" size="lg" weight="semibold">
        Heading / lg
      </Text>
      <Text size="base">Body / base</Text>
      <Text size="sm" tone="dim">
        Caption / sm dim
      </Text>
      <Text size="xs" mono tone="faint">
        MONO / xs faint
      </Text>
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(['default', 'dim', 'faint', 'accent', 'success', 'info', 'warning', 'danger'] as const).map(
        (t) => (
          <Text key={t} tone={t}>
            tone: {t}
          </Text>
        ),
      )}
    </div>
  ),
};
