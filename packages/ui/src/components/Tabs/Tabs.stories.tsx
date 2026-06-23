import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Tabs } from './Tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — clicking a tab switches the visible panel. */
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" style={{ maxWidth: 480 }}>
      <Tabs.List aria-label="Project sections">
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="activity">Activity</Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview">A high-level summary of the project.</Tabs.Panel>
      <Tabs.Panel value="activity">The latest events and changes.</Tabs.Panel>
      <Tabs.Panel value="settings">Configuration and preferences.</Tabs.Panel>
    </Tabs>
  ),
};

/** Job: Reveal State — active vs inactive, a disabled tab, and vertical orientation. */
export const States: Story = {
  render: () => (
    <Tabs defaultValue="a" orientation="vertical">
      <Tabs.List aria-label="Vertical example">
        <Tabs.Tab value="a">Active</Tabs.Tab>
        <Tabs.Tab value="b">Inactive</Tabs.Tab>
        <Tabs.Tab value="c" disabled>
          Disabled
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="a">Panel A is shown.</Tabs.Panel>
      <Tabs.Panel value="b">Panel B is shown.</Tabs.Panel>
      <Tabs.Panel value="c">Panel C is shown.</Tabs.Panel>
    </Tabs>
  ),
};

/** Job: Acknowledge Input — Arrow keys move focus and activate. */
export const Interaction: Story = {
  render: () => (
    <Tabs defaultValue="overview" style={{ maxWidth: 480 }}>
      <Tabs.List aria-label="Project sections">
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="activity">Activity</Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview">Overview panel.</Tabs.Panel>
      <Tabs.Panel value="activity">Activity panel.</Tabs.Panel>
      <Tabs.Panel value="settings">Settings panel.</Tabs.Panel>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole('tab', { name: 'Overview' });
    overview.focus();
    await userEvent.keyboard('{ArrowRight}');
    const activity = canvas.getByRole('tab', { name: 'Activity' });
    await expect(activity).toHaveAttribute('aria-selected', 'true');
    await expect(activity).toHaveFocus();
  },
};
