import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Button } from './Button';

describe('Button', () => {
  it('renders an accessible button with its label', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('activates on click and on keyboard (Enter / Space)', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(<Button onPress={onPress}>Go</Button>);
    const btn = screen.getByRole('button', { name: 'Go' });
    await user.click(btn);
    btn.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('does not activate when disabled', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onPress={onPress} disabled>
        Nope
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Nope' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('reflects loading via aria-busy', () => {
    render(<Button loading>Saving</Button>);
    expect(screen.getByRole('button', { name: 'Saving' })).toHaveAttribute('aria-busy', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Button>Accessible</Button>);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
