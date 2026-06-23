import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Textarea } from './Textarea';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  args: { label: 'Message', placeholder: 'Write something…' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a labeled, resizable multiline field. */
export const Default: Story = {};

/** Job: Reveal State — default / described / disabled / invalid. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
      <Textarea label="Default" placeholder="Type here" />
      <Textarea label="With description" description="Markdown is supported." />
      <Textarea label="Disabled" placeholder="Can't edit" disabled />
      <Textarea label="Invalid" defaultValue="Too short" error="Please write at least 20 characters." />
    </div>
  ),
};

/** Job: Acknowledge Input — typing is echoed. */
export const Interaction: Story = {
  args: { label: 'Bio' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText('Bio');
    await userEvent.type(field, 'Hello there');
    await expect(field).toHaveValue('Hello there');
  },
};
