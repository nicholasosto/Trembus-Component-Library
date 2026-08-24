import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Stepper } from './Stepper';
import type { StepperStep } from './Stepper';

const steps: StepperStep[] = [
  { label: 'Review files by type', status: 'done' },
  { label: 'Identify duplicates', status: 'done' },
  { label: 'Contextually organize', status: 'active', description: 'grouping 14 of 24' },
  { label: 'Draft final plan', status: 'pending' },
];

describe('Stepper', () => {
  it('renders every step as a listitem under a named list', () => {
    render(<Stepper steps={steps} label="Deep Clean" />);
    const list = screen.getByRole('list', { name: 'Deep Clean' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('marks the active step with aria-current="step"', () => {
    render(<Stepper steps={steps} label="Deep Clean" />);
    const active = screen.getByText('Contextually organize').closest('li');
    expect(active).toHaveAttribute('aria-current', 'step');
    // non-active steps do not
    expect(screen.getByText('Draft final plan').closest('li')).not.toHaveAttribute('aria-current');
  });

  it('conveys status as text, not colour alone', () => {
    render(<Stepper steps={steps} label="Deep Clean" />);
    expect(screen.getAllByText(/Completed:/)).toHaveLength(2);
    expect(screen.getByText(/In progress:/)).toBeInTheDocument();
    expect(screen.getByText(/Not started:/)).toBeInTheDocument();
  });

  it('derives keys from position so duplicate labels do not collide', () => {
    const dup: StepperStep[] = [
      { label: 'Same', status: 'done' },
      { label: 'Same', status: 'pending' },
    ];
    const { container } = render(<Stepper steps={dup} label="Dupes" />);
    expect(container.querySelectorAll('.tcl-stepper__step')).toHaveLength(2);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Stepper steps={steps} label="Deep Clean" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
