import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Select } from './Select';

function Options() {
  return (
    <>
      <option value="us">United States</option>
      <option value="ca">Canada</option>
    </>
  );
}

describe('Select', () => {
  it('exposes a labeled select', () => {
    render(
      <Select label="Country" placeholder="Choose">
        <Options />
      </Select>,
    );
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
  });

  it('updates the value when an option is chosen', async () => {
    const user = userEvent.setup();
    render(
      <Select label="Country" placeholder="Choose">
        <Options />
      </Select>,
    );
    const select = screen.getByLabelText('Country');
    await user.selectOptions(select, 'ca');
    expect(select).toHaveValue('ca');
  });

  it('exposes invalid state and announces the error', () => {
    render(
      <Select label="Country" placeholder="Choose" error="Required">
        <Options />
      </Select>,
    );
    const select = screen.getByLabelText('Country');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Required');
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Select label="Country" placeholder="Choose">
        <Options />
      </Select>,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
