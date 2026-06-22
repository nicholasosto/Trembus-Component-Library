import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Stat } from './Stat';

describe('Stat', () => {
  it('renders the strap, label, value, unit, and target', () => {
    render(
      <Stat
        strap="Cat 2 · Time Entry"
        label="DIRT — avg lag"
        value="1.0"
        unit="days"
        target="Target ≤ 1.0d"
      />,
    );
    expect(screen.getByText('Cat 2 · Time Entry')).toBeInTheDocument();
    expect(screen.getByText('DIRT — avg lag')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();
    expect(screen.getByText('days')).toBeInTheDocument();
    expect(screen.getByText('Target ≤ 1.0d')).toBeInTheDocument();
  });

  it('falls back to an em-dash when no value is given', () => {
    render(<Stat label="Onboarding health" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('colors a positive delta as good and a negative delta as bad by default', () => {
    const { container } = render(<Stat label="Margin" value="31" delta={{ value: 1.8 }} />);
    const chip = container.querySelector('.tcl-stat__delta');
    expect(chip).toHaveClass('tcl-stat__delta--good');
    expect(chip).toHaveAttribute('aria-label', expect.stringContaining('up'));
  });

  it('inverts delta semantics for latency metrics (down = good)', () => {
    const { container } = render(
      <Stat label="DIRT" value="1.0" delta={{ value: -0.2, text: '0.20d', invert: true }} />,
    );
    const chip = container.querySelector('.tcl-stat__delta');
    expect(chip).toHaveClass('tcl-stat__delta--good');
    expect(chip).toHaveAttribute('aria-label', expect.stringContaining('down'));
  });

  it('renders an embedded sparkline when a trend is provided', () => {
    const { container } = render(<Stat label="Revenue" value="318" trend={[1, 2, 3, 4]} />);
    expect(container.querySelector('.tcl-stat__spark')).toBeInTheDocument();
  });

  it('becomes a button that fires onSelect when interactive', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Stat label="DIRT — avg lag" value="1.0" onSelect={onSelect} />);
    const card = screen.getByRole('button', { name: /DIRT — avg lag/ });
    await user.click(card);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('activates via the keyboard (Enter / Space) when interactive', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Stat label="DIRT — avg lag" value="1.0" onSelect={onSelect} />);
    screen.getByRole('button', { name: /DIRT — avg lag/ }).focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('renders as a link when href is given', () => {
    render(<Stat label="DIRT — avg lag" value="1.0" href="/time" />);
    expect(screen.getByRole('link', { name: /DIRT — avg lag/ })).toHaveAttribute('href', '/time');
  });

  it('has no axe violations (static and interactive)', async () => {
    const staticCard = render(
      <Stat
        strap="Cat 5"
        label="Portfolio deal margin"
        value="31.4"
        unit="%"
        delta={{ value: 1.8, text: '+1.8pp' }}
        target="Target ≥ 28%"
        trend={[28, 29, 30, 31]}
      />,
    );
    expect(await a11yViolations(staticCard.container)).toEqual([]);
    const interactiveCard = render(<Stat label="DIRT" value="1.0" onSelect={() => {}} />);
    expect(await a11yViolations(interactiveCard.container)).toEqual([]);
  });
});
