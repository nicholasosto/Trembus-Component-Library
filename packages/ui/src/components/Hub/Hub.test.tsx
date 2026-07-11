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
    {
      id: 'core',
      pos: 'hub',
      kind: 'center',
      tag: 'Core',
      name: 'Platform',
      sub: 'shared',
      status: 'Reserved',
    },
    {
      id: 'web',
      pos: 'robot',
      kind: 'shipped',
      tag: 'Web',
      name: 'WebKit',
      sub: 'react',
      status: 'Shipped',
      note: 'The web library.',
    },
    {
      id: 'rbx',
      pos: 'blood',
      kind: 'shipped',
      tag: 'Roblox',
      name: 'RbxKit',
      sub: 'roblox-ts',
      status: 'Shipped',
    },
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

  it('uses one roving tab stop and supports arrow, Home, and End navigation', async () => {
    const user = userEvent.setup();
    render(<Hub data={data} />);
    const core = screen.getByRole('button', { name: /Platform/ });
    const web = screen.getByRole('button', { name: /WebKit/ });
    const roblox = screen.getByRole('button', { name: /RbxKit/ });

    expect(core).toHaveAttribute('tabindex', '0');
    expect(web).toHaveAttribute('tabindex', '-1');
    expect(roblox).toHaveAttribute('tabindex', '-1');

    core.focus();
    await user.keyboard('{ArrowRight}');
    expect(web).toHaveFocus();
    expect(web).toHaveAttribute('tabindex', '0');
    expect(core).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{End}');
    expect(roblox).toHaveFocus();
    await user.keyboard('{Home}');
    expect(core).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(roblox).toHaveFocus();
    expect(screen.getAllByRole('button').filter((button) => button.tabIndex === 0)).toHaveLength(1);
  });

  it('keeps a controlled pointer target tabbable when selection is not accepted', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Hub data={data} selectedId="core" onSelect={onSelect} />);
    const core = screen.getByRole('button', { name: /Platform/ });
    const web = screen.getByRole('button', { name: /WebKit/ });

    await user.click(web);

    expect(onSelect).toHaveBeenCalledWith('web');
    expect(web).toHaveFocus();
    expect(web).toHaveAttribute('tabindex', '0');
    expect(core).toHaveAttribute('tabindex', '-1');
    expect(core).toHaveAttribute('aria-pressed', 'true');
    expect(web).toHaveAttribute('aria-pressed', 'false');
  });

  it('preserves the roving target across equivalent controlled rerenders', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Hub data={data} selectedId="core" />);
    const core = screen.getByRole('button', { name: /Platform/ });
    core.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /WebKit/ })).toHaveFocus();

    rerender(
      <Hub
        data={{ ...data, domains: data.domains.map((domain) => ({ ...domain })) }}
        selectedId="core"
      />,
    );

    expect(screen.getByRole('button', { name: /WebKit/ })).toHaveFocus();
    expect(screen.getByRole('button', { name: /WebKit/ })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: /Platform/ })).toHaveAttribute('tabindex', '-1');
  });

  it('moves an in-Hub focus target when controlled selection changes', () => {
    const { rerender } = render(<Hub data={data} selectedId="core" />);
    screen.getByRole('button', { name: /Platform/ }).focus();

    rerender(<Hub data={data} selectedId="rbx" />);

    expect(screen.getByRole('button', { name: /RbxKit/ })).toHaveFocus();
    expect(screen.getByRole('button', { name: /RbxKit/ })).toHaveAttribute('tabindex', '0');
    expect(screen.getAllByRole('button').filter((button) => button.tabIndex === 0)).toHaveLength(1);
  });

  it('renders the first duplicate id once and retains one tab stop', () => {
    render(
      <Hub
        data={{
          ...data,
          domains: [
            ...data.domains,
            {
              ...data.domains[1]!,
              name: 'Duplicate WebKit',
            },
          ],
        }}
      />,
    );

    expect(screen.queryByRole('button', { name: /Duplicate WebKit/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getAllByRole('button').filter((button) => button.tabIndex === 0)).toHaveLength(1);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Hub data={data} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
