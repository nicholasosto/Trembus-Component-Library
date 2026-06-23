import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('toggles when its label is clicked', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Accept" />);
    const box = screen.getByRole('checkbox', { name: 'Accept' });
    expect(box).not.toBeChecked();
    await user.click(screen.getByText('Accept'));
    expect(box).toBeChecked();
  });

  it('reflects indeterminate on the DOM node', () => {
    render(<Checkbox label="All" indeterminate />);
    expect(screen.getByRole('checkbox', { name: 'All' })).toBePartiallyChecked();
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Locked" disabled />);
    const box = screen.getByRole('checkbox', { name: 'Locked' });
    await user.click(box);
    expect(box).not.toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Checkbox label="Subscribe" description="One email per week." />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
