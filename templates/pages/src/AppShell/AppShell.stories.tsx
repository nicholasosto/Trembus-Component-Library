// Storybook is the ITERATION surface for this template — not a consumer.
// The story renders the template's shipped slot defaults verbatim (plain
// anchors, no router) plus placeholder page content in `children`.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, Stack, Text } from '@trembus/ui';
import { AppShell } from './AppShell';

const meta = {
  title: 'Templates/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The shell exactly as it copies into an app: sticky header (brand · nav ·
 * theme toggle), skip link, main region fed by `children`, footer. */
export const Default: Story = {
  render: () => (
    <AppShell>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text as="h1" size="xl" weight="bold">
            Page title
          </Text>
          <Text tone="dim">
            Placeholder page content — in your app this region is the main-content slot (children or
            your router outlet).
          </Text>
        </Stack>
        <div
          style={{
            display: 'grid',
            gap: 'var(--tcl-space-5)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {['Alpha', 'Beta', 'Gamma'].map((name) => (
            <Card key={name}>
              <Card.Header>{name}</Card.Header>
              <Card.Body>
                <Text size="sm" tone="dim">
                  Example card content.
                </Text>
              </Card.Body>
            </Card>
          ))}
        </div>
      </Stack>
    </AppShell>
  ),
};
