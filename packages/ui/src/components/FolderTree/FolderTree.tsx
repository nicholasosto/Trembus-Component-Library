import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Glyph, fileToGlyph } from '@trembus/icons';
import { Input } from '../Input/Input';
import { Spinner } from '../Spinner/Spinner';
import './FolderTree.css';

/**
 * A node in the folder forest. The shape is **nested** (children inline) — the
 * natural file-tree idiom, and the one that makes lazy loading clean. Ids are
 * optional: an omitted id is derived from the node's position (`${parentId}/${i}`),
 * so a literal filesystem dump renders without bookkeeping.
 */
export interface FolderNode {
  /** Stable unique id. Omitted → derived from position; provide it if the tree reorders. */
  id?: string;
  /** Display name, e.g. "Button.tsx". Doubles as the accessible name. */
  label: string;
  /** Folder vs file. Inferred when omitted: children/hasChildren ⇒ folder, else file. */
  kind?: 'folder' | 'file';
  /** Explicit glyph name override (else inferred: folder/folder-open, or the icons package's `fileToGlyph` — well-known basenames like SKILL.md / .env first, then extension). */
  icon?: string;
  /** Nested children. A folder with no children is still expandable if `hasChildren`. */
  children?: FolderNode[];
  /** Lazy: mark a folder expandable before its children are loaded. */
  hasChildren?: boolean;
  /** Non-interactive row (no select / no check), still focusable for reading. */
  disabled?: boolean;
}

export interface FolderTreeProps {
  /** The forest — one or more roots. */
  data: FolderNode[];
  /** Accessible name for the tree (announced by screen readers). */
  label?: string;
  // ── expansion (controlled / uncontrolled) ──
  expandedIds?: string[];
  defaultExpandedIds?: string[];
  onExpandedChange?: (ids: string[]) => void;
  // ── single selection (controlled / uncontrolled) ──
  selectedId?: string;
  defaultSelectedId?: string;
  /** Selection callback — receives the id and the node itself. */
  onSelect?: (id: string, node: FolderNode) => void;
  // ── multi-select checkboxes (opt-in) ──
  checkable?: boolean;
  checkedIds?: string[];
  defaultCheckedIds?: string[];
  onCheckedChange?: (ids: string[]) => void;
  // ── filter (opt-in): `true` shows a built-in box; a string drives it controlled ──
  filter?: boolean | string;
  onFilterChange?: (query: string) => void;
  // ── lazy children ──
  /** Called on first expand of an unloaded folder; a spinner shows while a promise is pending, a failure marks the row. */
  onLoadChildren?: (node: FolderNode) => FolderNode[] | Promise<FolderNode[]>;
  className?: string;
}

/** A required-id node (after normalization). */
type Node = FolderNode & { id: string };

/** A flattened visible row in DOM order — the model the keyboard navigation walks. */
interface Row {
  node: Node;
  level: number; // 1-based (aria-level)
  posinset: number; // 1-based among visible siblings
  setsize: number; // count of visible siblings
  parentId?: string;
  expandable: boolean;
  expanded: boolean;
  loading: boolean;
  errored: boolean;
}

type CheckState = 'checked' | 'unchecked' | 'mixed';

const HANDLED_KEYS = new Set([
  'ArrowDown',
  'ArrowUp',
  'ArrowRight',
  'ArrowLeft',
  'Home',
  'End',
  'Enter',
  ' ',
]);

/** Assign every node a stable id, deriving from position when absent. */
function normalize(nodes: FolderNode[], parentId: string): Node[] {
  return nodes.map((n, i) => {
    const id = n.id ?? `${parentId}/${i}`;
    const out: Node = { ...n, id };
    if (n.children) out.children = normalize(n.children, id);
    return out;
  });
}

export function FolderTree({
  data,
  label = 'Files',
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
  selectedId,
  defaultSelectedId,
  onSelect,
  checkable = false,
  checkedIds,
  defaultCheckedIds,
  onCheckedChange,
  filter = false,
  onFilterChange,
  onLoadChildren,
  className,
}: FolderTreeProps) {
  const rowEls = useRef(new Map<string, HTMLDivElement>());

  // ── expansion state ──
  const expControlled = expandedIds !== undefined;
  const [expInternal, setExpInternal] = useState<Set<string>>(() => new Set(defaultExpandedIds));
  const expanded = useMemo(
    () => (expControlled ? new Set(expandedIds) : expInternal),
    [expControlled, expandedIds, expInternal],
  );
  const commitExpanded = useCallback(
    (next: Set<string>) => {
      if (!expControlled) setExpInternal(next);
      onExpandedChange?.(Array.from(next));
    },
    [expControlled, onExpandedChange],
  );

  // ── selection state ──
  const selControlled = selectedId !== undefined;
  const [selInternal, setSelInternal] = useState<string | undefined>(defaultSelectedId);
  const selected = selControlled ? selectedId : selInternal;

  // ── checked state (a set of leaf / unloaded-folder ids; folder state is derived) ──
  const checkControlled = checkedIds !== undefined;
  const [checkInternal, setCheckInternal] = useState<Set<string>>(() => new Set(defaultCheckedIds));
  const checked = useMemo(
    () => (checkControlled ? new Set(checkedIds) : checkInternal),
    [checkControlled, checkedIds, checkInternal],
  );
  const commitChecked = useCallback(
    (next: Set<string>) => {
      if (!checkControlled) setCheckInternal(next);
      onCheckedChange?.(Array.from(next));
    },
    [checkControlled, onCheckedChange],
  );

  // ── filter state ──
  const filterEnabled = filter === true || typeof filter === 'string';
  const filterControlled = typeof filter === 'string';
  const [queryInternal, setQueryInternal] = useState('');
  const query = filterControlled ? filter : queryInternal;
  const q = filterEnabled ? query.trim().toLowerCase() : '';
  const filtering = q.length > 0;
  const setQuery = useCallback(
    (v: string) => {
      if (!filterControlled) setQueryInternal(v);
      onFilterChange?.(v);
    },
    [filterControlled, onFilterChange],
  );

  // ── lazy-loading state ──
  const [loaded, setLoaded] = useState<Record<string, Node[]>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(() => new Set());
  const [erroredIds, setErroredIds] = useState<Set<string>>(() => new Set());
  // synchronous in-flight guard: a state setter wouldn't be visible to a second
  // call in the same tick, so two rapid expands could double-fire onLoadChildren.
  const loadingRef = useRef(new Set<string>());

  // a live mirror of `checked`, so the async load handler reconciles against the
  // latest set (not a stale render's closure).
  const checkedRef = useRef(checked);
  checkedRef.current = checked;

  // ── roving focus ──
  const [focusId, setFocusId] = useState<string | undefined>(defaultSelectedId);

  const tree = useMemo(() => normalize(data, 'root'), [data]);

  const childrenOf = useCallback(
    (node: Node): Node[] | undefined => (node.children as Node[] | undefined) ?? loaded[node.id],
    [loaded],
  );
  const isFolder = useCallback(
    (node: Node): boolean =>
      node.kind === 'folder' ||
      (node.kind !== 'file' &&
        (node.children != null || node.hasChildren === true || loaded[node.id] != null)),
    [loaded],
  );

  // ── filter pass: which ids are visible, which match, which must auto-expand ──
  const { visibleIds, matchIds, autoExpandIds } = useMemo(() => {
    if (!filtering) {
      return {
        visibleIds: null as Set<string> | null,
        matchIds: new Set<string>(),
        autoExpandIds: new Set<string>(),
      };
    }
    const visible = new Set<string>();
    const match = new Set<string>();
    const autoExpand = new Set<string>();
    const walk = (node: Node): boolean => {
      const selfMatch = node.label.toLowerCase().includes(q);
      const kids = childrenOf(node);
      let childMatch = false;
      if (kids) for (const k of kids) childMatch = walk(k) || childMatch;
      if (selfMatch) match.add(node.id);
      if (selfMatch || childMatch) {
        visible.add(node.id);
        if (childMatch) autoExpand.add(node.id);
      }
      return selfMatch || childMatch;
    };
    tree.forEach(walk);
    return { visibleIds: visible, matchIds: match, autoExpandIds: autoExpand };
  }, [filtering, q, tree, childrenOf]);

  const isExpanded = useCallback(
    (id: string): boolean => expanded.has(id) || (filtering && autoExpandIds.has(id)),
    [expanded, filtering, autoExpandIds],
  );

  // ── flatten the visible tree into rows in DOM order ──
  const rows = useMemo(() => {
    const out: Row[] = [];
    const walk = (nodes: Node[], level: number, parentId: string | undefined): void => {
      const siblings = visibleIds ? nodes.filter((n) => visibleIds.has(n.id)) : nodes;
      siblings.forEach((node, i) => {
        const folder = isFolder(node);
        const open = folder && isExpanded(node.id);
        out.push({
          node,
          level,
          posinset: i + 1,
          setsize: siblings.length,
          parentId,
          expandable: folder,
          expanded: open,
          loading: loadingIds.has(node.id),
          errored: erroredIds.has(node.id),
        });
        if (open) {
          const kids = childrenOf(node);
          if (kids && kids.length) walk(kids, level + 1, node.id);
        }
      });
    };
    walk(tree, 1, undefined);
    return out;
  }, [tree, visibleIds, isFolder, isExpanded, childrenOf, loadingIds, erroredIds]);

  const rowIndex = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r, i) => m.set(r.node.id, i));
    return m;
  }, [rows]);

  // the single tabbable row (roving tabindex), guarded against a stale focusId
  const tabbableId = (focusId && rowIndex.has(focusId) ? focusId : rows[0]?.node.id) ?? undefined;

  // If the focused row was removed (e.g. filtered out) AND focus actually fell to
  // the body, re-home it onto the new tabbable row. Guarded so we never steal
  // focus from the filter input or anything outside the tree.
  useEffect(() => {
    if (!focusId || rowIndex.has(focusId)) return;
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if ((!active || active === document.body) && tabbableId) {
      rowEls.current.get(tabbableId)?.focus();
      setFocusId(tabbableId);
    }
  }, [focusId, rowIndex, tabbableId]);

  // ── checkbox cascade ──
  const checkStateOf = useCallback(
    (node: Node): CheckState => {
      const kids = childrenOf(node);
      if (!isFolder(node) || !kids || kids.length === 0) {
        return checked.has(node.id) ? 'checked' : 'unchecked';
      }
      let anyChecked = false;
      let anyUnchecked = false;
      for (const k of kids) {
        const s = checkStateOf(k);
        if (s === 'mixed') return 'mixed';
        if (s === 'checked') anyChecked = true;
        else anyUnchecked = true;
        if (anyChecked && anyUnchecked) return 'mixed';
      }
      return anyChecked ? 'checked' : 'unchecked';
    },
    [checked, childrenOf, isFolder],
  );

  const toggleCheck = useCallback(
    (node: Node) => {
      if (node.disabled) return;
      const target = checkStateOf(node) !== 'checked'; // mixed | unchecked → check
      const next = new Set(checked);
      const apply = (n: Node) => {
        const kids = childrenOf(n);
        if (isFolder(n) && kids && kids.length) {
          kids.forEach(apply);
        } else if (target) {
          next.add(n.id);
        } else {
          next.delete(n.id);
        }
      };
      apply(node);
      commitChecked(next);
    },
    [checked, checkStateOf, childrenOf, isFolder, commitChecked],
  );

  // ── expansion + lazy loading ──
  const loadChildren = useCallback(
    (node: Node) => {
      if (!onLoadChildren || loadingRef.current.has(node.id) || loaded[node.id] || node.children) {
        return;
      }
      loadingRef.current.add(node.id);
      setErroredIds((prev) => {
        if (!prev.has(node.id)) return prev;
        const n = new Set(prev);
        n.delete(node.id);
        return n;
      });
      setLoadingIds((prev) => new Set(prev).add(node.id));
      Promise.resolve(onLoadChildren(node))
        .then((kids) => {
          const normalized = normalize(kids, node.id);
          setLoaded((prev) => ({ ...prev, [node.id]: normalized }));
          // If the folder was checked while still unloaded, its own id stood in
          // for the (unknown) subtree. Now that the leaves exist, push the check
          // down to them so the derived folder state stays "checked".
          if (checkedRef.current.has(node.id)) {
            const next = new Set(checkedRef.current);
            next.delete(node.id);
            const addLeaves = (ns: Node[]): void =>
              ns.forEach((n) => {
                const gk = n.children as Node[] | undefined;
                if (gk && gk.length) addLeaves(gk);
                else next.add(n.id);
              });
            addLeaves(normalized);
            commitChecked(next);
          }
        })
        .catch(() => {
          setErroredIds((prev) => new Set(prev).add(node.id));
        })
        .finally(() => {
          loadingRef.current.delete(node.id);
          setLoadingIds((prev) => {
            const n = new Set(prev);
            n.delete(node.id);
            return n;
          });
        });
    },
    [onLoadChildren, loaded, commitChecked],
  );

  const setExpand = useCallback(
    (node: Node, open: boolean) => {
      const next = new Set(expanded);
      if (open) {
        next.add(node.id);
        loadChildren(node);
      } else {
        next.delete(node.id);
      }
      commitExpanded(next);
    },
    [expanded, commitExpanded, loadChildren],
  );

  const select = useCallback(
    (node: Node) => {
      if (node.disabled) return;
      if (!selControlled) setSelInternal(node.id);
      onSelect?.(node.id, node);
    },
    [selControlled, onSelect],
  );

  const moveFocus = useCallback((id: string | undefined) => {
    if (!id) return;
    setFocusId(id);
    rowEls.current.get(id)?.focus();
  }, []);

  // ── activation: select, and (for folders) toggle expansion — same on click & Enter ──
  const activate = useCallback(
    (row: Row) => {
      const { node } = row;
      moveFocus(node.id);
      if (node.disabled) return;
      select(node);
      if (row.expandable) setExpand(node, !row.expanded);
    },
    [moveFocus, select, setExpand],
  );

  const onRowClick = useCallback(
    (e: MouseEvent<HTMLDivElement>, row: Row) => {
      if (row.node.disabled) {
        moveFocus(row.node.id);
        return;
      }
      const targetEl = e.target as HTMLElement;
      if (checkable && targetEl.closest('[data-ft-check]')) {
        moveFocus(row.node.id);
        toggleCheck(row.node);
        return;
      }
      if (row.expandable && targetEl.closest('[data-ft-chevron]')) {
        moveFocus(row.node.id);
        setExpand(row.node, !row.expanded);
        return;
      }
      activate(row);
    },
    [checkable, moveFocus, toggleCheck, setExpand, activate],
  );

  const onRowKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, row: Row) => {
      if (!HANDLED_KEYS.has(e.key)) return;
      e.preventDefault();
      const idx = rowIndex.get(row.node.id) ?? 0;
      switch (e.key) {
        case 'ArrowDown':
          moveFocus(rows[Math.min(idx + 1, rows.length - 1)]?.node.id);
          break;
        case 'ArrowUp':
          moveFocus(rows[Math.max(idx - 1, 0)]?.node.id);
          break;
        case 'Home':
          moveFocus(rows[0]?.node.id);
          break;
        case 'End':
          moveFocus(rows[rows.length - 1]?.node.id);
          break;
        case 'ArrowRight':
          if (row.expandable && !row.expanded) setExpand(row.node, true);
          else if (row.expandable && row.expanded) {
            // move to the first child only if one is actually rendered (not mid-lazy-load)
            const next = rows[idx + 1];
            if (next && next.level > row.level) moveFocus(next.node.id);
          }
          break;
        case 'ArrowLeft':
          if (row.expandable && row.expanded) setExpand(row.node, false);
          else moveFocus(row.parentId);
          break;
        case 'Enter':
          activate(row);
          break;
        case ' ':
          if (checkable) {
            moveFocus(row.node.id);
            toggleCheck(row.node);
          } else {
            activate(row);
          }
          break;
      }
    },
    [rows, rowIndex, moveFocus, setExpand, activate, checkable, toggleCheck],
  );

  const renderLabel = useCallback(
    (text: string): ReactNode => {
      if (!filtering) return text;
      const lower = text.toLowerCase();
      const at = lower.indexOf(q);
      if (at < 0) return text;
      return (
        <>
          {text.slice(0, at)}
          <mark className="tcl-folder-tree__match">{text.slice(at, at + q.length)}</mark>
          {text.slice(at + q.length)}
        </>
      );
    },
    [filtering, q],
  );

  const liveMessage = filtering
    ? `${matchIds.size} ${matchIds.size === 1 ? 'match' : 'matches'}`
    : '';

  return (
    <div className={cx('tcl-folder-tree', className)}>
      {filterEnabled && (
        <div className="tcl-folder-tree__filter">
          <Input
            label={`Filter ${label}`}
            type="search"
            value={query}
            placeholder="Filter…"
            startSlot={<Glyph name="search" />}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
        </div>
      )}

      <span className="tcl-sr-only" role="status" aria-live="polite">
        {liveMessage}
      </span>

      {rows.length === 0 ? (
        <p className="tcl-folder-tree__empty">{filtering ? 'No matches.' : 'No items.'}</p>
      ) : (
        <div role="tree" aria-label={label} className="tcl-folder-tree__tree">
          {rows.map((row) => {
            const { node, level } = row;
            const selectedRow = selected === node.id;
            const check = checkable ? checkStateOf(node) : undefined;
            const iconName =
              node.icon ??
              (row.expandable
                ? row.expanded
                  ? 'folder-open'
                  : 'folder'
                : fileToGlyph(node.label));
            return (
              <div
                key={node.id}
                ref={(el) => {
                  if (el) rowEls.current.set(node.id, el);
                  else rowEls.current.delete(node.id);
                }}
                role="treeitem"
                aria-level={level}
                aria-setsize={row.setsize}
                aria-posinset={row.posinset}
                aria-expanded={row.expandable ? row.expanded : undefined}
                aria-selected={selectedRow}
                aria-checked={
                  check ? (check === 'mixed' ? 'mixed' : check === 'checked') : undefined
                }
                aria-label={node.label}
                aria-disabled={node.disabled || undefined}
                tabIndex={node.id === tabbableId ? 0 : -1}
                data-state={selectedRow ? 'selected' : undefined}
                data-kind={row.expandable ? 'folder' : 'file'}
                className="tcl-folder-tree__item"
                style={{ paddingInlineStart: `calc(${level - 1} * var(--tcl-space-5))` }}
                onClick={(e) => onRowClick(e, row)}
                onKeyDown={(e) => onRowKeyDown(e, row)}
              >
                <span className="tcl-folder-tree__twist" data-ft-chevron aria-hidden="true">
                  {row.expandable &&
                    (row.loading ? (
                      <Spinner size="sm" />
                    ) : (
                      <Glyph name="chevron-right" className="tcl-folder-tree__chevron" />
                    ))}
                </span>

                {checkable && (
                  <span
                    className="tcl-folder-tree__check"
                    data-ft-check
                    data-state={check}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 12 12" fill="none" className="tcl-folder-tree__check-mark">
                      <path
                        d="M2.5 6.5L4.8 8.8L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}

                <span className="tcl-folder-tree__icon" aria-hidden="true">
                  <Glyph name={iconName} />
                </span>

                <span className="tcl-folder-tree__label">{renderLabel(node.label)}</span>

                {row.errored && (
                  <span className="tcl-folder-tree__error" aria-hidden="true">
                    failed
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
