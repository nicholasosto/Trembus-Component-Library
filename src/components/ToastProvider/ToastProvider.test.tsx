import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { ToastProvider, useToast } from './ToastProvider';
import type { ToastTone } from './ToastProvider';

function Harness({ tone = 'success' as ToastTone }: { tone?: ToastTone }) {
  const { toast } = useToast();
  return (
    <button onClick={() => toast({ title: 'Saved', description: 'All good.', tone })}>notify</button>
  );
}

describe('ToastProvider', () => {
  it('shows a toast when triggered (role=status)', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'notify' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('uses role=alert for danger toasts', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Harness tone="danger" />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'notify' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Saved');
  });

  it('dismisses via the close button', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'notify' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('auto-dismisses after the duration', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider duration={150}>
        <Harness />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'notify' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Saved')).not.toBeInTheDocument(), {
      timeout: 1000,
    });
  });

  it('has no axe violations with a toast shown', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'notify' }));
    expect(await a11yViolations(baseElement)).toEqual([]);
  });
});
