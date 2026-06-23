import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Switch } from './Switch';

describe('Switch', () => {
  it('exposes a switch role with its label', () => {
    render(<Switch label="Wi-Fi" />);
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeInTheDocument();
  });

  it('toggles on click', async () => {
    const user = userEvent.setup();
    render(<Switch label="Wi-Fi" />);
    const sw = screen.getByRole('switch', { name: 'Wi-Fi' });
    expect(sw).not.toBeChecked();
    await user.click(sw);
    expect(sw).toBeChecked();
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    render(<Switch label="Locked" disabled />);
    const sw = screen.getByRole('switch', { name: 'Locked' });
    await user.click(sw);
    expect(sw).not.toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Switch label="Notifications" description="Activity alerts." />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
