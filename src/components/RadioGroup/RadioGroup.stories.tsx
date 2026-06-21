import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { RadioGroup } from './RadioGroup';

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a labeled set of choices. */
export const Default: Story = {
  render: () => (
    <RadioGroup name="plan-default" defaultValue="free" label="Plan">
      <RadioGroup.Item value="free" label="Free" description="For personal projects." />
      <RadioGroup.Item value="pro" label="Pro" description="For growing teams." />
      <RadioGroup.Item value="team" label="Team" description="For organizations." />
    </RadioGroup>
  ),
};

/** Job: Reveal State — selected, plus a disabled option and a group error. */
export const States: Story = {
  render: () => (
    <RadioGroup name="plan-states" defaultValue="pro" label="Plan" error="Upgrade required for this feature.">
      <RadioGroup.Item value="free" label="Free" />
      <RadioGroup.Item value="pro" label="Pro" />
      <RadioGroup.Item value="team" label="Team" disabled />
    </RadioGroup>
  ),
};

/** Job: Acknowledge Input — selecting changes the active option. */
export const Interaction: Story = {
  render: () => (
    <RadioGroup name="plan-interaction" defaultValue="free" label="Plan">
      <RadioGroup.Item value="free" label="Free" />
      <RadioGroup.Item value="pro" label="Pro" />
    </RadioGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Free' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'Pro' }));
    await expect(canvas.getByRole('radio', { name: 'Pro' })).toBeChecked();
  },
};
