import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(<Dialog open={false} onClose={() => {}} title="Hi" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a labelled modal and moves focus inside on open', () => {
    render(
      <Dialog open onClose={() => {}} title="Confirm" description="Are you sure?">
        <button>Inside</button>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Confirm');
    expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Dialog open onClose={onClose} title="X">
        <button>ok</button>
      </Dialog>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('returns focus to the trigger on close', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <Dialog open={open} onClose={() => setOpen(false)} title="T">
            <button>inside</button>
          </Dialog>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('has no axe violations when open', async () => {
    const { baseElement } = render(
      <Dialog open onClose={() => {}} title="Accessible" description="desc">
        <button>ok</button>
      </Dialog>,
    );
    const results = await axe(baseElement);
    expect(results.violations).toEqual([]);
  });
});
