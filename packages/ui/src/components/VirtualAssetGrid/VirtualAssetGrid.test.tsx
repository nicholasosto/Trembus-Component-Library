import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { a11yViolations } from '../../test/a11y';
import { VirtualAssetGrid } from './VirtualAssetGrid';

interface Item {
  id: string;
  name: string;
  kind: string;
}

// jsdom has no ResizeObserver — mock one we can drive with a chosen content-box size.
let observers: Array<{ cb: ResizeObserverCallback }> = [];
class MockResizeObserver {
  cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    observers.push({ cb: this.cb });
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    observers = observers.filter((o) => o.cb !== this.cb);
  }
}
function fireResize(width: number, height: number): void {
  act(() => {
    for (const { cb } of observers) {
      cb([{ contentRect: { width, height } } as ResizeObserverEntry], {} as ResizeObserver);
    }
  });
}

beforeEach(() => {
  observers = [];
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
});
afterEach(() => {
  delete (globalThis as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
});

const tile = (item: Item): ReactElement => <span>{item.name}</span>;
const key = (item: Item): string => item.id;
const nameOf = (item: Item): string => item.name;

/** 5 items in section A, 3 in section B → flat A0..A4,B0..B2. At cols=3: A rows [A0 A1 A2 / A3 A4], B row [B0 B1 B2]. */
function abItems(): Item[] {
  return [
    ...Array.from({ length: 5 }, (_, i) => ({ id: `a${i}`, name: `A${i}`, kind: 'A' })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `b${i}`, name: `B${i}`, kind: 'B' })),
  ];
}

function renderAB(extra?: Record<string, unknown>) {
  const utils = render(
    <VirtualAssetGrid
      items={abItems()}
      getKey={key}
      getLabel={nameOf}
      renderTile={tile}
      groupBy={(x) => x.kind}
      groupOrder={['A', 'B']}
      virtualize={false}
      minTileWidth={200}
      gap={10}
      tileHeight={100}
      {...extra}
    />,
  );
  fireResize(660, 400); // → cols = floor((660+10)/210) = 3
  return utils;
}

describe('VirtualAssetGrid', () => {
  it('renders a listbox of option tiles with per-section counted subheads', () => {
    renderAB();
    expect(screen.getByRole('listbox', { name: 'Assets' })).toBeInTheDocument();
    expect(screen.getAllByRole('group')).toHaveLength(2);
    expect(screen.getAllByRole('option')).toHaveLength(8);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('exposes a single roving tabindex', () => {
    renderAB();
    expect(screen.getByRole('option', { name: 'A0' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('option', { name: 'A1' })).toHaveAttribute('tabindex', '-1');
  });

  it('moves focus 2D by the live column count, across section boundaries', () => {
    renderAB();
    const a0 = screen.getByRole('option', { name: 'A0' });
    a0.focus();

    fireEvent.keyDown(a0, { key: 'ArrowDown' }); // A0(col0,row0) → A3
    expect(screen.getByRole('option', { name: 'A3' })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('option', { name: 'A3' }), { key: 'ArrowDown' }); // A3 → B0 (col0)
    expect(screen.getByRole('option', { name: 'B0' })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('option', { name: 'B0' }), { key: 'ArrowUp' }); // B0 → back up to A3
    expect(screen.getByRole('option', { name: 'A3' })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('option', { name: 'A4' }), { key: 'ArrowRight' }); // A4 → B0 (flat +1)
    expect(screen.getByRole('option', { name: 'B0' })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('option', { name: 'B2' }), { key: 'Home' });
    expect(screen.getByRole('option', { name: 'A0' })).toHaveFocus();
  });

  it('clamps a partial last row on ArrowDown (never focuses an empty cell)', () => {
    renderAB();
    const a2 = screen.getByRole('option', { name: 'A2' });
    a2.focus();
    // A2 is col2 row0; the row below in section A (A3,A4) has no col2 → clamp to A4.
    fireEvent.keyDown(a2, { key: 'ArrowDown' });
    expect(screen.getByRole('option', { name: 'A4' })).toHaveFocus();
  });

  it('selects on click and Enter, announcing via the live region (uncontrolled)', () => {
    const onSelect = vi.fn();
    renderAB({ onSelect });
    const a1 = screen.getByRole('option', { name: 'A1' });
    fireEvent.click(a1);
    expect(onSelect).toHaveBeenCalledWith('a1', expect.objectContaining({ id: 'a1' }));
    expect(a1).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(/A1 selected/);

    const b2 = screen.getByRole('option', { name: 'B2' });
    b2.focus();
    fireEvent.keyDown(b2, { key: 'Enter' });
    expect(onSelect).toHaveBeenLastCalledWith('b2', expect.objectContaining({ id: 'b2' }));
  });

  it('is controllable — selectedId drives selection and clicks do not mutate it', () => {
    const onSelect = vi.fn();
    renderAB({ selectedId: 'a0', onSelect });
    fireEvent.click(screen.getByRole('option', { name: 'A1' }));
    expect(onSelect).toHaveBeenCalledWith('a1', expect.objectContaining({ id: 'a1' }));
    expect(screen.getByRole('option', { name: 'A0' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'A1' })).toHaveAttribute('aria-selected', 'false');
  });

  it('windows a large dataset — only visible tiles mount, all subheads stay', () => {
    const KINDS = ['Images', 'Audio', 'Models', 'Docs'];
    const big: Item[] = Array.from({ length: 400 }, (_, i) => ({
      id: `i${i}`,
      name: `item ${i}`,
      kind: KINDS[i % KINDS.length],
    }));
    render(
      <VirtualAssetGrid
        items={big}
        getKey={key}
        getLabel={nameOf}
        renderTile={tile}
        groupBy={(x) => x.kind}
        groupOrder={KINDS}
        minTileWidth={200}
        gap={10}
        tileHeight={100}
      />,
    );
    fireResize(660, 200);
    const opts = screen.getAllByRole('option');
    expect(opts.length).toBeGreaterThan(0);
    expect(opts.length).toBeLessThan(big.length);
    expect(screen.getAllByRole('group')).toHaveLength(4);
  });

  it('scrolls a windowed-out tile into view, mounts and focuses it', () => {
    const big: Item[] = Array.from({ length: 120 }, (_, i) => ({
      id: `i${i}`,
      name: `item ${i}`,
      kind: 'A',
    }));
    render(
      <VirtualAssetGrid
        items={big}
        getKey={key}
        getLabel={nameOf}
        renderTile={tile}
        minTileWidth={200}
        gap={10}
        tileHeight={100}
      />,
    );
    fireResize(660, 120);
    expect(screen.queryByRole('option', { name: 'item 119' })).not.toBeInTheDocument();
    const first = screen.getAllByRole('option')[0];
    first.focus();
    fireEvent.keyDown(first, { key: 'End' });
    const last = screen.getByRole('option', { name: 'item 119' });
    expect(last).toBeInTheDocument();
    expect(last).toHaveFocus();
  });

  it('renders no subheads when groupBy is omitted, and still roves', () => {
    render(
      <VirtualAssetGrid
        items={abItems()}
        getKey={key}
        getLabel={nameOf}
        renderTile={tile}
        virtualize={false}
        minTileWidth={200}
        gap={10}
        tileHeight={100}
      />,
    );
    fireResize(660, 400);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    const a0 = screen.getByRole('option', { name: 'A0' });
    a0.focus();
    fireEvent.keyDown(a0, { key: 'ArrowRight' });
    expect(screen.getByRole('option', { name: 'A1' })).toHaveFocus();
  });

  it('skips an empty groupOrder key and appends unlisted keys in first-seen order', () => {
    render(
      <VirtualAssetGrid
        items={abItems()}
        getKey={key}
        getLabel={nameOf}
        renderTile={tile}
        groupBy={(x) => x.kind}
        groupOrder={['Z', 'B']} // 'Z' has no items (skipped); 'A' unlisted → appends after 'B'
        virtualize={false}
        minTileWidth={200}
        gap={10}
        tileHeight={100}
      />,
    );
    fireResize(660, 400);
    const groups = screen.getAllByRole('group');
    expect(groups).toHaveLength(2);
    // group name includes the label AND the count (parity with the visible subhead)
    expect(groups[0]).toHaveAccessibleName('B 3');
    expect(groups[1]).toHaveAccessibleName('A 5');
  });

  it('warns (dev) on duplicate getKey rather than silently deduping', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <VirtualAssetGrid
        items={[
          { id: 'dup', name: 'One', kind: 'A' },
          { id: 'dup', name: 'Two', kind: 'A' },
        ]}
        getKey={key}
        getLabel={nameOf}
        renderTile={tile}
        virtualize={false}
        minTileWidth={200}
        gap={10}
        tileHeight={100}
      />,
    );
    fireResize(660, 400);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('duplicate getKey'));
    warn.mockRestore();
  });

  it('renders the empty state when there are no items', () => {
    render(<VirtualAssetGrid items={[]} getKey={key} renderTile={tile} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('No assets.')).toBeInTheDocument();
  });

  it('always mounts the tabbable anchor even when it is windowed out (keyboard reachable)', () => {
    const big: Item[] = Array.from({ length: 120 }, (_, i) => ({
      id: `i${i}`,
      name: `item ${i}`,
      kind: 'A',
    }));
    render(
      <VirtualAssetGrid
        items={big}
        getKey={key}
        getLabel={nameOf}
        renderTile={tile}
        defaultSelectedId="i119" // seeds the roving tabindex onto the LAST tile
        minTileWidth={200}
        gap={10}
        tileHeight={100}
      />,
    );
    fireResize(660, 120); // small viewport → i119 is far below the window
    // Most tiles are windowed out, but the tabbable one must still be in the DOM…
    expect(screen.getAllByRole('option').length).toBeLessThan(big.length);
    const anchor = screen.getByRole('option', { name: 'item 119' });
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('tabindex', '0'); // …as the tab-in anchor
  });

  it('re-homes focus (not to body) when the focused tile leaves the data', () => {
    const A: Item[] = Array.from({ length: 30 }, (_, i) => ({
      id: `i${i}`,
      name: `item ${i}`,
      kind: 'A',
    }));
    const { rerender } = render(
      <VirtualAssetGrid
        items={A}
        getKey={key}
        getLabel={nameOf}
        renderTile={tile}
        defaultSelectedId="i3"
        virtualize={false}
        minTileWidth={200}
        gap={10}
        tileHeight={100}
      />,
    );
    fireResize(660, 400);
    const i3 = screen.getByRole('option', { name: 'item 3' });
    i3.focus();
    expect(i3).toHaveFocus();

    // Remove the focused tile from the data — focus must not silently drop to <body>.
    rerender(
      <VirtualAssetGrid
        items={A.filter((x) => x.id !== 'i3')}
        getKey={key}
        getLabel={nameOf}
        renderTile={tile}
        defaultSelectedId="i3"
        virtualize={false}
        minTileWidth={200}
        gap={10}
        tileHeight={100}
      />,
    );
    expect(screen.getByRole('option', { name: 'item 0' })).toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });

  it('does not divide by zero when tileHeight and gap are both 0', () => {
    render(
      <VirtualAssetGrid
        items={abItems()}
        getKey={key}
        getLabel={nameOf}
        renderTile={tile}
        virtualize={false}
        minTileWidth={200}
        gap={0}
        tileHeight={0}
      />,
    );
    expect(() => fireResize(660, 400)).not.toThrow();
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
  });

  it('has no axe violations (full tree via virtualize=false)', async () => {
    const { container } = renderAB();
    expect(await a11yViolations(container)).toEqual([]);
  });
});
