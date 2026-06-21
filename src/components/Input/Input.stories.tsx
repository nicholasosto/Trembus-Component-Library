import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  args: { label: 'Email', placeholder: 'you@example.com' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a labeled, focusable, editable field. */
export const Default: Story = {};

/** Job: Reveal State — default / described / disabled / invalid. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
      <Input label="Default" placeholder="Type here" />
      <Input label="With description" description="We never share it." placeholder="you@example.com" />
      <Input label="Disabled" placeholder="Can't edit" disabled />
      <Input label="Invalid" defaultValue="not-an-email" error="Enter a valid email address." />
    </div>
  ),
};

/** Job: Acknowledge Input — typing is echoed; focus shows a ring. */
export const Interaction: Story = {
  args: { label: 'Name', placeholder: 'Ada Lovelace' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Name');
    await userEvent.type(input, 'Ada Lovelace');
    await expect(input).toHaveValue('Ada Lovelace');
  },
};
