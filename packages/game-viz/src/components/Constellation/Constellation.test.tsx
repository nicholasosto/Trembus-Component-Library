import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '@trembus/tokens/testing';
import { Constellation } from './Constellation';
import type { ConstellationContract } from './Constellation';

const rite: ConstellationContract = {
  title: 'Rite',
  points: 6,
  tiers: [{ label: 'Acolyte' }, { label: 'Adept' }],
  nodes: [
    { id: 'ember', label: 'Ember Mark', tier: 0, maxRank: 2 },
    { id: 'gift', label: 'Blood Gift', tier: 1, requires: ['ember'] },
  ],
};

describe('Constellation', () => {
  it('frames the TalentTree whose talents are focusable buttons', () => {
    const { container } = render(<Constellation data={rite} />);
    expect(container.querySelector('.tcl-constellation')).not.toBeNull();
    expect(container.querySelector('.tcl-talent-tree')).not.toBeNull();
    expect(screen.getByRole('button', { name: /^Ember Mark,/ })).toBeInTheDocument();
  });

  it('defaults to the accent frame and honors the tone prop (data-tone)', () => {
    const { container, rerender } = render(<Constellation data={rite} />);
    expect(container.querySelector('.tcl-constellation')?.getAttribute('data-tone')).toBe('accent');
    rerender(<Constellation data={rite} tone="danger" />);
    expect(container.querySelector('.tcl-constellation')?.getAttribute('data-tone')).toBe('danger');
  });

  it('renders the designation tab when provided', () => {
    render(<Constellation data={rite} designation="Reliquary Archive" />);
    expect(screen.getByText('Reliquary Archive')).toBeInTheDocument();
  });

  it('passes the allocation spine straight through', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Constellation data={rite} onAllocatedChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /^Ember Mark,/ }));
    expect(onChange).toHaveBeenCalledWith({ ember: 1 }, { id: 'ember', rank: 1 });
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Constellation data={rite} defaultAllocated={{ ember: 1 }} defaultSelectedId="ember" />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
