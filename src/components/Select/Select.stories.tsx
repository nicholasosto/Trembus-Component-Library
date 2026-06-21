import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Select } from './Select';

const Options = () => (
  <>
    <option value="us">United States</option>
    <option value="ca">Canada</option>
    <option value="mx">Mexico</option>
  </>
);

const meta = {
  title: 'Components/Select',
  component: Select,
  // Stories render their own Select; this satisfies the required `children` prop.
  args: { children: <Options /> },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a labeled native select. */
export const Default: Story = {
  render: () => (
    <Select label="Country" placeholder="Choose a country…">
      <Options />
    </Select>
  ),
};

/** Job: Reveal State — selected / disabled / invalid. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
      <Select label="Selected" defaultValue="ca">
        <Options />
      </Select>
      <Select label="Disabled" placeholder="Choose…" disabled>
        <Options />
      </Select>
      <Select label="Invalid" placeholder="Choose…" error="Please pick a country.">
        <Options />
      </Select>
    </div>
  ),
};

/** Job: Acknowledge Input — choosing an option updates the value. */
export const Interaction: Story = {
  render: () => (
    <Select label="Country" placeholder="Choose…">
      <Options />
    </Select>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByLabelText('Country');
    await userEvent.selectOptions(select, 'ca');
    await expect(select).toHaveValue('ca');
  },
};
