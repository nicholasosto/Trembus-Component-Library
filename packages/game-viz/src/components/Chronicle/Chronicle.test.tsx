import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '@trembus/tokens/testing';
import { Chronicle } from './Chronicle';
import type { ChronicleContract } from './Chronicle';

const ages: ChronicleContract = {
  title: 'Chronicle',
  categories: [{ key: 'war', label: 'Wars', tone: 'danger' }],
  events: [
    {
      id: 'pact',
      at: 0,
      dateLabel: '0 A.V.',
      label: 'The First Pact',
      category: 'war',
      note: 'Founded on the drowned altar.',
    },
    { id: 'rite', at: 12, dateLabel: 'XII A.V.', label: 'The Silent Rite', category: 'war' },
  ],
};

describe('Chronicle', () => {
  it('frames a Timeline whose events are focusable buttons', () => {
    const { container } = render(<Chronicle data={ages} />);
    expect(container.querySelector('.tcl-chronicle')).not.toBeNull();
    expect(
      screen.getByRole('button', { name: '0 A.V.: The First Pact — Wars' }),
    ).toBeInTheDocument();
  });

  it('defaults to the danger frame accent and honors the tone prop (data-tone)', () => {
    const { container, rerender } = render(<Chronicle data={ages} />);
    expect(container.querySelector('.tcl-chronicle')?.getAttribute('data-tone')).toBe('danger');
    rerender(<Chronicle data={ages} tone="accent" />);
    expect(container.querySelector('.tcl-chronicle')?.getAttribute('data-tone')).toBe('accent');
  });

  it('renders the archive tab when provided', () => {
    render(<Chronicle data={ages} archive="The Reliquary Archive" />);
    expect(screen.getByText('The Reliquary Archive')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Chronicle data={ages} defaultSelectedId="pact" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
