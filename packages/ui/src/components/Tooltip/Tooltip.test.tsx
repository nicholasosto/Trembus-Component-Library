import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Tooltip } from './Tooltip';

function Example() {
  return (
    <Tooltip content="More info" openDelay={0}>
      <button>Help</button>
    </Tooltip>
  );
}

describe('Tooltip', () => {
  it('shows on focus and is bound via aria-describedby', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Help' });
    trigger.focus();
    const tip = await screen.findByRole('tooltip');
    expect(tip).toHaveTextContent('More info');
    expect(trigger).toHaveAttribute('aria-describedby', tip.id);
  });

  it('hides on Escape', async () => {
    const user = userEvent.setup();
    render(<Example />);
    screen.getByRole('button', { name: 'Help' }).focus();
    await screen.findByRole('tooltip');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides on blur', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Help' });
    trigger.focus();
    await screen.findByRole('tooltip');
    trigger.blur();
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it('has no axe violations when open', async () => {
    const { baseElement } = render(<Example />);
    screen.getByRole('button', { name: 'Help' }).focus();
    await screen.findByRole('tooltip');
    expect(await a11yViolations(baseElement)).toEqual([]);
  });
});
