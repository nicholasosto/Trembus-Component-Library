import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pressable } from './Pressable';

describe('Pressable', () => {
  it('renders a real button and fires onPress on click', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(<Pressable onPress={onPress}>Go</Pressable>);
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reveals interaction state via data-state', async () => {
    const user = userEvent.setup();
    render(<Pressable>Hover</Pressable>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-state', 'idle');
    await user.hover(btn);
    expect(btn).toHaveAttribute('data-state', 'hover');
  });

  it('does not activate when disabled', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Pressable disabled onPress={onPress}>
        No
      </Pressable>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('asChild lends behavior to a link with no extra wrapper DOM', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Pressable asChild onPress={onPress}>
        <a href="#x">Link</a>
      </Pressable>,
    );
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link).toHaveClass('tcl-pressable');
    await user.click(link);
    expect(onPress).toHaveBeenCalled();
  });
});
