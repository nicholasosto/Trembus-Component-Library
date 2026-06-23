import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { RadioGroup } from './RadioGroup';

function Example() {
  return (
    <RadioGroup name="plan" defaultValue="free" label="Plan">
      <RadioGroup.Item value="free" label="Free" />
      <RadioGroup.Item value="pro" label="Pro" />
      <RadioGroup.Item value="team" label="Team" />
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('exposes a labeled radiogroup', () => {
    render(<Example />);
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument();
  });

  it('selects one option and deselects the others', async () => {
    const user = userEvent.setup();
    render(<Example />);
    expect(screen.getByRole('radio', { name: 'Free' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Pro' }));
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Free' })).not.toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Example />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
