import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Input } from './Input';

describe('Input', () => {
  it('associates the label so clicking it focuses the field', async () => {
    const user = userEvent.setup();
    render(<Input label="Email" />);
    const input = screen.getByLabelText('Email');
    await user.click(screen.getByText('Email'));
    expect(input).toHaveFocus();
  });

  it('accepts typed input', async () => {
    const user = userEvent.setup();
    render(<Input label="Name" />);
    const input = screen.getByLabelText('Name');
    await user.type(input, 'Ada');
    expect(input).toHaveValue('Ada');
  });

  it('exposes invalid state and announces the error', () => {
    render(<Input label="Email" error="Required" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Required');
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Input label="Email" description="We never share it." />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
