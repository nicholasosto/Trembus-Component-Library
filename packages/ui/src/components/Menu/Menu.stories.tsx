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

/** Job: Afford Action — a button opens a command set in a portal. */
export const Default: Story = {
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
        <Menu.Item onSelect={() => {}}>Move to…</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};

/** Job: Reveal State — a disabled item and end-aligned content. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Menu>
        <Menu.Trigger>
          <Button variant="outline" tone="neutral">
            Actions
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
    </div>
  ),
};

/** Job: Acknowledge Input — open, arrow to an item, select, menu closes. */
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
