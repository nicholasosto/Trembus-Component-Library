import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '@trembus/tokens/testing';
import { Reliquary } from './Reliquary';

describe('Reliquary', () => {
  it('renders label, tag, and tone-coded status readouts as perceivable text', () => {
    render(
      <Reliquary
        label="SUBJECT · 001"
        tag="THE KEPT KNIGHT"
        status={[
          { label: 'SOUL INTEGRITY — 34.7%', tone: 'danger' },
          { label: 'CONTAINMENT STABLE', tone: 'success' },
        ]}
      >
        <div>portrait</div>
      </Reliquary>,
    );
    expect(screen.getByText('SUBJECT · 001')).toBeInTheDocument();
    expect(screen.getByText('THE KEPT KNIGHT')).toBeInTheDocument();
    // the meaning lives in the words, not just the tone color
    expect(screen.getByText('SOUL INTEGRITY — 34.7%')).toBeInTheDocument();
    expect(screen.getByText('CONTAINMENT STABLE')).toBeInTheDocument();
    expect(screen.getByText('portrait')).toBeInTheDocument();
  });

  it('marks the corner reticle decorative (aria-hidden) so it never pollutes the a11y tree', () => {
    const { container } = render(<Reliquary>x</Reliquary>);
    const brackets = container.querySelectorAll('.tcl-reliquary__bracket');
    expect(brackets).toHaveLength(4);
    brackets.forEach((b) => expect(b).toHaveAttribute('aria-hidden', 'true'));
  });

  it('becomes a labelled group only when aria-label is provided', () => {
    const { rerender } = render(<Reliquary>x</Reliquary>);
    expect(screen.queryByRole('group')).toBeNull();
    rerender(<Reliquary aria-label="Kept Knight reliquary">x</Reliquary>);
    expect(screen.getByRole('group', { name: 'Kept Knight reliquary' })).toBeInTheDocument();
  });

  it('omits the status strip when no status is provided', () => {
    const { container } = render(<Reliquary label="X">y</Reliquary>);
    expect(container.querySelector('.tcl-reliquary__status')).toBeNull();
  });

  it('has no axe violations (incl. a real focusable child)', async () => {
    const { container } = render(
      <Reliquary
        aria-label="frame"
        label="SUBJECT · 001"
        tag="KNIGHT"
        status={[{ label: 'STABLE', tone: 'success' }]}
      >
        <button type="button">Play</button>
      </Reliquary>,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
