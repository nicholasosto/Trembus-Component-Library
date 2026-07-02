import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Menu } from './Menu';

const meta = {
  title: 'Components/Menu',
  component: Menu,
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Job: Afford Action — a titled command set. The "Send to Roblox" row opens a
 * submenu of alternates (→ or click), the accessible replacement for hover-only
 * quick actions.
 */
export const Default: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger>
        <Button variant="outline" tone="neutral">
          DCC Bridge
        </Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Label>DCC Bridge</Menu.Label>
        <Menu.Item onSelect={() => {}}>Send to ZBrush</Menu.Item>
        <Menu.Sub>
          <Menu.SubTrigger>Send to Roblox</Menu.SubTrigger>
          <Menu.SubContent>
            <Menu.Item onSelect={() => {}}>Send</Menu.Item>
            <Menu.Item onSelect={() => {}}>Send + download</Menu.Item>
            <Menu.Item onSelect={() => {}}>Send with log</Menu.Item>
          </Menu.SubContent>
        </Menu.Sub>
        <Menu.Item onSelect={() => {}}>Send to Blender</Menu.Item>
        <Menu.Separator />
        <Menu.Item onSelect={() => {}} disabled>
          Send to OV/Isaac
        </Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};

/**
 * Job: Reveal State — a disabled item, end-alignment, and (right) a menu that
 * opens upward (`side="top"`) for a bottom-docked bar.
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start', paddingTop: 160 }}>
      <Menu>
        <Menu.Trigger>
          <Button variant="outline" tone="neutral">
            End-aligned
          </Button>
        </Menu.Trigger>
        <Menu.Content align="end">
          <Menu.Item onSelect={() => {}}>Rename</Menu.Item>
          <Menu.Item onSelect={() => {}}>Share</Menu.Item>
          <Menu.Item onSelect={() => {}} disabled>
            Archive (disabled)
          </Menu.Item>
        </Menu.Content>
      </Menu>
      <Menu>
        <Menu.Trigger>
          <Button variant="outline" tone="neutral">
            Opens upward
          </Button>
        </Menu.Trigger>
        <Menu.Content side="top">
          <Menu.Label>Bottom-bar menu</Menu.Label>
          <Menu.Item onSelect={() => {}}>Cut</Menu.Item>
          <Menu.Item onSelect={() => {}}>Copy</Menu.Item>
          <Menu.Item onSelect={() => {}}>Paste</Menu.Item>
        </Menu.Content>
      </Menu>
    </div>
  ),
};

/** Job: Acknowledge Input — open, arrow to an item, select; the menu closes. */
export const Interaction: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger>
        <Button variant="outline" tone="neutral">
          Options
        </Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item onSelect={() => {}}>Edit</Menu.Item>
        <Menu.Item onSelect={() => {}}>Duplicate</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Options' }));
    await expect(await screen.findByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    await expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  },
};
