import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Callout } from './Callout';

describe('Callout', () => {
  it('renders its title and body', () => {
    render(
      <Callout tone="info" title="Heads up">
        A new build is rolling out.
      </Callout>,
    );
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('A new build is rolling out.')).toBeInTheDocument();
  });

  it('applies the tone class', () => {
    const { container } = render(<Callout tone="danger" title="Sync failed" />);
    expect(container.querySelector('.tcl-callout')).toHaveClass('tcl-callout--danger');
  });

  it('shows a default tone icon, and hides it when icon is null', () => {
    const { container, rerender } = render(<Callout tone="success" title="Done" />);
    expect(container.querySelector('.tcl-callout__icon')).toBeInTheDocument();
    rerender(
      <Callout tone="success" title="Done" icon={null}>
        body
      </Callout>,
    );
    expect(container.querySelector('.tcl-callout__icon')).not.toBeInTheDocument();
  });

  it('renders no dismiss button without onDismiss', () => {
    render(<Callout title="Static" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('fires onDismiss when the close button is activated', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<Callout title="Closeable" onDismiss={onDismiss} dismissLabel="Close alert" />);
    await user.click(screen.getByRole('button', { name: 'Close alert' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Callout tone="warning" title="Action needed" onDismiss={() => {}}>
        Three engagements need attention.
      </Callout>,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
