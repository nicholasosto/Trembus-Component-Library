import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { IconButton } from './IconButton';

const Icon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 3v10" />
  </svg>
);

describe('IconButton', () => {
  it('takes its accessible name from aria-label', () => {
    render(
      <IconButton aria-label="Add item">
        <Icon />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
  });

  it('activates on click', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <IconButton aria-label="Add" onPress={onPress}>
        <Icon />
      </IconButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('forwards ref to the underlying button', () => {
    function Harness() {
      const ref = useRef<HTMLButtonElement>(null);
      return (
        <>
          <IconButton aria-label="Add" ref={ref}>
            <Icon />
          </IconButton>
          <span data-testid="tag">{ref.current?.tagName ?? ''}</span>
        </>
      );
    }
    const { rerender } = render(<Harness />);
    rerender(<Harness />);
    expect(screen.getByTestId('tag')).toHaveTextContent('BUTTON');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <IconButton aria-label="Add item">
        <Icon />
      </IconButton>,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
