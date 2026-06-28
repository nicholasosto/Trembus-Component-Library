import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { FolderTree } from './FolderTree';
import type { FolderNode } from './FolderTree';

const DATA: FolderNode[] = [
  {
    id: 'src',
    label: 'src',
    kind: 'folder',
    children: [
      { id: 'index', label: 'index.ts' },
      {
        id: 'comp',
        label: 'components',
        kind: 'folder',
        children: [
          { id: 'btn', label: 'Button.tsx' },
          { id: 'card', label: 'Card.tsx' },
        ],
      },
    ],
  },
  { id: 'readme', label: 'README.md' },
];

describe('FolderTree', () => {
  it('renders roots, hides collapsed children, and is axe-clean', async () => {
    const { container } = render(<FolderTree data={DATA} label="Files" />);
    expect(screen.getByRole('tree', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'src' })).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'README.md' })).toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: 'index.ts' })).not.toBeInTheDocument();
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('is axe-clean when checkable and filtered', async () => {
    const { container } = render(
      <FolderTree
        data={DATA}
        label="Files"
        checkable
        filter
        defaultExpandedIds={['src', 'comp']}
      />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('expands a folder on click and reveals its children', () => {
    render(<FolderTree data={DATA} label="Files" />);
    const src = screen.getByRole('treeitem', { name: 'src' });
    expect(src).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(src);
    expect(src).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('treeitem', { name: 'index.ts' })).toBeInTheDocument();
  });

  it('selects a file and fires onSelect with id + node', () => {
    const onSelect = vi.fn();
    render(<FolderTree data={DATA} label="Files" onSelect={onSelect} />);
    const readme = screen.getByRole('treeitem', { name: 'README.md' });
    fireEvent.click(readme);
    expect(readme).toHaveAttribute('aria-selected', 'true');
    expect(onSelect).toHaveBeenCalledWith('readme', expect.objectContaining({ id: 'readme' }));
  });

  it('supports roving keyboard navigation (Arrow keys expand/collapse/move)', () => {
    render(<FolderTree data={DATA} label="Files" />);
    const src = screen.getByRole('treeitem', { name: 'src' });
    expect(src).toHaveAttribute('tabindex', '0');
    src.focus();

    fireEvent.keyDown(src, { key: 'ArrowRight' }); // expand
    expect(src).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(src, { key: 'ArrowRight' }); // move to first child
    const index = screen.getByRole('treeitem', { name: 'index.ts' });
    expect(index).toHaveFocus();

    fireEvent.keyDown(index, { key: 'ArrowUp' }); // back to src
    expect(src).toHaveFocus();

    fireEvent.keyDown(src, { key: 'ArrowLeft' }); // collapse
    expect(src).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('treeitem', { name: 'index.ts' })).not.toBeInTheDocument();
  });

  it('cascades checkbox state and shows mixed parents', () => {
    render(<FolderTree data={DATA} label="Files" checkable defaultExpandedIds={['src', 'comp']} />);
    const comp = screen.getByRole('treeitem', { name: 'components' });
    const btn = screen.getByRole('treeitem', { name: 'Button.tsx' });
    const card = screen.getByRole('treeitem', { name: 'Card.tsx' });

    fireEvent.click(comp.querySelector('[data-ft-check]')!); // check the folder
    expect(comp).toHaveAttribute('aria-checked', 'true');
    expect(btn).toHaveAttribute('aria-checked', 'true');
    expect(card).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(card.querySelector('[data-ft-check]')!); // uncheck one leaf
    expect(card).toHaveAttribute('aria-checked', 'false');
    expect(comp).toHaveAttribute('aria-checked', 'mixed');
  });

  it('toggles a checkbox with Space without selecting', () => {
    const onSelect = vi.fn();
    render(<FolderTree data={DATA} label="Files" checkable onSelect={onSelect} />);
    const readme = screen.getByRole('treeitem', { name: 'README.md' });
    readme.focus();
    fireEvent.keyDown(readme, { key: ' ' });
    expect(readme).toHaveAttribute('aria-checked', 'true');
    expect(readme).toHaveAttribute('aria-selected', 'false');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('filters the tree and auto-expands ancestors of matches', () => {
    render(<FolderTree data={DATA} label="Files" filter />);
    const input = screen.getByRole('searchbox', { name: /Filter/i });
    fireEvent.change(input, { target: { value: 'button' } });

    expect(screen.getByRole('treeitem', { name: 'Button.tsx' })).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'src' })).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'components' })).toBeInTheDocument();
    // non-matching siblings drop out
    expect(screen.queryByRole('treeitem', { name: 'index.ts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: 'README.md' })).not.toBeInTheDocument();
  });

  it('lazily loads children on first expand', async () => {
    const onLoadChildren = vi.fn(async () => [{ label: 'a.ts' }, { label: 'b.ts' }]);
    render(
      <FolderTree
        data={[{ id: 'nm', label: 'node_modules', kind: 'folder', hasChildren: true }]}
        label="Files"
        onLoadChildren={onLoadChildren}
      />,
    );
    const nm = screen.getByRole('treeitem', { name: 'node_modules' });
    expect(nm).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(nm);
    expect(onLoadChildren).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('treeitem', { name: 'a.ts' })).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'b.ts' })).toBeInTheDocument();

    // re-collapsing and re-expanding must not refetch
    fireEvent.click(nm);
    fireEvent.click(nm);
    expect(onLoadChildren).toHaveBeenCalledTimes(1);
  });

  it('keeps a lazily-loaded folder checked after its children arrive', async () => {
    const onLoadChildren = vi.fn(async () => [{ label: 'a.ts' }, { label: 'b.ts' }]);
    render(
      <FolderTree
        data={[{ id: 'nm', label: 'node_modules', kind: 'folder', hasChildren: true }]}
        label="Files"
        checkable
        onLoadChildren={onLoadChildren}
      />,
    );
    const nm = screen.getByRole('treeitem', { name: 'node_modules' });
    // check the folder BEFORE it has loaded any children
    fireEvent.click(nm.querySelector('[data-ft-check]')!);
    expect(nm).toHaveAttribute('aria-checked', 'true');

    // expand → children load → the folder must stay checked and the leaves inherit it
    fireEvent.click(nm);
    const a = await screen.findByRole('treeitem', { name: 'a.ts' });
    expect(nm).toHaveAttribute('aria-checked', 'true');
    expect(a).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('treeitem', { name: 'b.ts' })).toHaveAttribute('aria-checked', 'true');
  });

  it('does not expand a disabled folder when its chevron is clicked', () => {
    const data: FolderNode[] = [
      {
        id: 'd',
        label: 'locked',
        kind: 'folder',
        disabled: true,
        children: [{ id: 'x', label: 'x.ts' }],
      },
    ];
    render(<FolderTree data={data} label="Files" />);
    const locked = screen.getByRole('treeitem', { name: 'locked' });
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(locked.querySelector('[data-ft-chevron]')!);
    expect(locked).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('treeitem', { name: 'x.ts' })).not.toBeInTheDocument();
  });

  it('re-homes focus to a visible row when the focused row is filtered out', () => {
    render(<FolderTree data={DATA} label="Files" filter defaultExpandedIds={['src']} />);
    const src = screen.getByRole('treeitem', { name: 'src' });
    src.focus();
    fireEvent.keyDown(src, { key: 'ArrowDown' }); // focus moves to index.ts (sets focusId)
    expect(screen.getByRole('treeitem', { name: 'index.ts' })).toHaveFocus();

    const input = screen.getByRole('searchbox', { name: /Filter/i });
    fireEvent.change(input, { target: { value: 'readme' } }); // index.ts drops out

    expect(document.body).not.toHaveFocus();
    expect(screen.getByRole('treeitem', { name: 'README.md' })).toHaveFocus();
  });

  it('derives stable ids for nodes without one', () => {
    const onSelect = vi.fn();
    render(<FolderTree data={[{ label: 'loose.ts' }]} label="Files" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('treeitem', { name: 'loose.ts' }));
    expect(onSelect).toHaveBeenCalledWith('root/0', expect.objectContaining({ label: 'loose.ts' }));
  });
});

describe('FolderTree (within helper keeps lint happy)', () => {
  it('scopes queries to a row', () => {
    render(<FolderTree data={DATA} label="Files" checkable defaultExpandedIds={['src']} />);
    const comp = screen.getByRole('treeitem', { name: 'components' });
    expect(within(comp).queryByText('components')).toBeInTheDocument();
  });
});
