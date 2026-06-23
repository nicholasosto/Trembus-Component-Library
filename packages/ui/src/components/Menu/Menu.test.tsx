import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Button } from '../Button/Button';
import { Menu } from './Menu';

function Example({ onEdit = () => {} }: { onEdit?: () => void }) {
  return (
    <Menu>
      <Menu.Trigger>
        <Button>Options</Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item onSelect={onEdit}>Edit</Menu.Item>
        <Menu.Item onSelect={() => {}}>Duplicate</Menu.Item>
        <Menu.Item onSelect={() => {}} disabled>
          Archive
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}

describe('Menu', () => {
  it('opens on trigger click and exposes the menu', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Options' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('selects an item: calls onSelect, closes, returns focus to trigger', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<Example onEdit={onEdit} />);
    const trigger = screen.getByRole('button', { name: 'Options' });
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Options' });
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('moves focus among items with ArrowDown (first item focused on open)', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
  });

  it('has no axe violations when open', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(await a11yViolations(baseElement)).toEqual([]);
  });
});
