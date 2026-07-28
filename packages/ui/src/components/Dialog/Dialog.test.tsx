import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
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

  it('sizes the panel by preset, including the data-dense tier', () => {
    const { rerender } = render(
      <Dialog open onClose={() => {}} title="T" size="xl">
        <button>ok</button>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toHaveClass('tcl-dialog--xl');
    rerender(
      <Dialog open onClose={() => {}} title="T" size="full">
        <button>ok</button>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toHaveClass('tcl-dialog--full');
  });

  it('expands to full and back, swapping the control’s accessible name', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <Dialog open onClose={() => {}} title="Assets" size="lg" expandable {...{ onExpandedChange }}>
        <button>ok</button>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('tcl-dialog--lg');

    const expand = screen.getByRole('button', { name: 'Expand dialog' });
    await user.click(expand);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(dialog).toHaveClass('tcl-dialog--full');

    // The control keeps its identity but renames, so the state is never ambiguous.
    const collapse = screen.getByRole('button', { name: 'Collapse dialog' });
    await user.click(collapse);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(dialog).toHaveClass('tcl-dialog--lg');
  });

  it('respects a controlled expanded state (no internal toggling)', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <Dialog
        open
        onClose={() => {}}
        title="Controlled"
        size="md"
        expandable
        expanded={false}
        onExpandedChange={onExpandedChange}
      >
        <button>ok</button>
      </Dialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Expand dialog' }));
    // Intent reported, state unchanged — the parent owns it.
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('dialog')).toHaveClass('tcl-dialog--md');
  });

  it('renders the expand control even with no title, and none unless expandable', () => {
    const { rerender } = render(
      <Dialog open onClose={() => {}} expandable>
        <button>ok</button>
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'Expand dialog' })).toBeInTheDocument();
    rerender(
      <Dialog open onClose={() => {}} title="Plain">
        <button>ok</button>
      </Dialog>,
    );
    expect(screen.queryByRole('button', { name: /dialog$/ })).not.toBeInTheDocument();
  });

  it('keeps the body as the only scroll region so the footer stays reachable', () => {
    render(
      <Dialog open onClose={() => {}} title="T" footer={<button>Save</button>}>
        <p>long content</p>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    // The footer is a sibling of the scrolling body, never inside it.
    const body = dialog.querySelector('.tcl-dialog__body');
    const footer = dialog.querySelector('.tcl-dialog__footer');
    expect(body).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
    expect(body?.contains(footer as Node)).toBe(false);
  });

  it('has no axe violations when open', async () => {
    const { baseElement } = render(
      <Dialog open onClose={() => {}} title="Accessible" description="desc">
        <button>ok</button>
      </Dialog>,
    );
    expect(await a11yViolations(baseElement)).toEqual([]);
  });
});
