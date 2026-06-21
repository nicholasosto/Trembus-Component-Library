import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('associates the label so clicking it focuses the field', async () => {
    const user = userEvent.setup();
    render(<Textarea label="Message" />);
    const field = screen.getByLabelText('Message');
    await user.click(screen.getByText('Message'));
    expect(field).toHaveFocus();
  });

  it('accepts typed input', async () => {
    const user = userEvent.setup();
    render(<Textarea label="Notes" />);
    const field = screen.getByLabelText('Notes');
    await user.type(field, 'a line');
    expect(field).toHaveValue('a line');
  });

  it('exposes invalid state and announces the error', () => {
    render(<Textarea label="Bio" error="Too short" />);
    const field = screen.getByLabelText('Bio');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Too short');
    expect(screen.getByRole('alert')).toHaveTextContent('Too short');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Textarea label="Message" description="Be concise." />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
