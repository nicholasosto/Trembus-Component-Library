import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders its title and description', () => {
    render(<EmptyState title="No data" description="Nothing matched the filters." />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nothing matched the filters.')).toBeInTheDocument();
  });

  it('shows a default glyph and hides it when icon is null', () => {
    const { container, rerender } = render(<EmptyState title="No data" />);
    expect(container.querySelector('.tcl-empty__icon')).toBeInTheDocument();
    rerender(<EmptyState title="No data" icon={null} />);
    expect(container.querySelector('.tcl-empty__icon')).not.toBeInTheDocument();
  });

  it('renders the pending-source chip when provided', () => {
    render(<EmptyState title="Pending" pendingSource="wsc.pending" />);
    expect(screen.getByText('wsc.pending')).toBeInTheDocument();
    expect(screen.getByText(/Source not yet exposed/)).toBeInTheDocument();
  });

  it('renders an action and forwards its activation', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <EmptyState
        title="Connect a source"
        action={<button onClick={onAction}>Connect source</button>}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Connect source' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <EmptyState
        title="Pending work-start confirmation"
        description="This metric will populate once the source feed is connected."
        pendingSource="wsc.pending"
        action={<button>Connect source</button>}
      />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
