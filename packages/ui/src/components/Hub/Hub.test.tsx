import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Hub } from './Hub';
import type { HubContract } from './Hub';

const data: HubContract = {
  view: 'hub',
  brand: 'Trembus',
  code: 'trembus.platform',
  sub: 'Overview.',
  domains: [
    { id: 'core', pos: 'hub', kind: 'center', tag: 'Core', name: 'Platform', sub: 'shared', status: 'Reserved' },
    { id: 'web', pos: 'robot', kind: 'shipped', tag: 'Web', name: 'WebKit', sub: 'react', status: 'Shipped', note: 'The web library.' },
    { id: 'rbx', pos: 'blood', kind: 'shipped', tag: 'Roblox', name: 'RbxKit', sub: 'roblox-ts', status: 'Shipped' },
  ],
};

describe('Hub', () => {
  it('renders a tile button per domain', () => {
    render(<Hub data={data} />);
    expect(screen.getByRole('button', { name: /Platform/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /WebKit/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /RbxKit/ })).toBeInTheDocument();
  });

  it('shows the header code and an inspector hint by default', () => {
    render(<Hub data={data} />);
    expect(screen.getByText('trembus.platform')).toBeInTheDocument();
    expect(screen.getByText(/Select a domain/)).toBeInTheDocument();
  });

  it('selects a tile, sets aria-pressed, and reveals its note', async () => {
    const user = userEvent.setup();
    render(<Hub data={data} />);
    const tile = screen.getByRole('button', { name: /WebKit/ });
    expect(tile).toHaveAttribute('aria-pressed', 'false');
    await user.click(tile);
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('The web library.')).toBeInTheDocument();
  });

  it('calls onSelect with the domain id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Hub data={data} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /WebKit/ }));
    expect(onSelect).toHaveBeenCalledWith('web');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Hub data={data} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
