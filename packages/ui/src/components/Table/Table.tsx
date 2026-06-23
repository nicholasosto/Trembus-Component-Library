import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type {
  AriaAttributes,
  CSSProperties,
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { cx } from '../../utils/cx';
import { Checkbox } from '../Checkbox/Checkbox';
import './Table.css';

// ── public shared types ──────────────────────────────────────────────
export type SortDirection = 'asc' | 'desc';
export interface SortDescriptor {
  /** The `sortKey` of the currently sorted column. */
  column: string;
  direction: SortDirection;
}
export type TableDensity = 'comfortable' | 'compact';
export type SelectionMode = 'none' | 'multiple';
export type CellAlign = 'start' | 'center' | 'end';

// Internal prop injected into the first body cell of an interactive row so the
// cell can host the stretched link/button (see TableRow).
interface PrimaryLink {
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
}

// ── context ──────────────────────────────────────────────────────────
interface TableContextValue {
  density: TableDensity;
  sortDescriptor: SortDescriptor | null;
  onSortChange?: (descriptor: SortDescriptor) => void;
  selectionMode: SelectionMode;
  isSelected: (key: string) => boolean;
  toggleRow: (key: string) => void;
  registerRow: (key: string) => void;
  unregisterRow: (key: string) => void;
  allSelected: boolean;
  someSelected: boolean;
  toggleAll: () => void;
}

const TableContext = createContext<TableContextValue | null>(null);

function useTableContext(part: string): TableContextValue {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error(`<Table.${part}> must be used within <Table>.`);
  return ctx;
}

type Section = 'head' | 'body' | 'foot';
const SectionContext = createContext<Section>('body');

// ── root ─────────────────────────────────────────────────────────────
export interface TableProps extends Omit<TableHTMLAttributes<HTMLTableElement>, 'onSelect'> {
  /** Row padding scale. `compact` also drops the body font to `--tcl-text-sm`. */
  density?: TableDensity;
  /** Zebra-stripe the body rows. */
  striped?: boolean;
  /** Pin the header row while the body scrolls (needs `maxHeight` to scroll vertically). */
  sticky?: boolean;
  /** Caps the scroll container height; pair with `sticky` for a pinned header. */
  maxHeight?: number | string;
  /** Controlled sort state — the active column + direction. The table reflects
   * `aria-sort`; YOU reorder the data in response to `onSortChange`. */
  sortDescriptor?: SortDescriptor | null;
  onSortChange?: (descriptor: SortDescriptor) => void;
  /** `multiple` adds a checkbox column with a tri-state select-all in the head. */
  selectionMode?: SelectionMode;
  /** Controlled selection. */
  selectedKeys?: Iterable<string>;
  /** Uncontrolled initial selection. */
  defaultSelectedKeys?: Iterable<string>;
  onSelectionChange?: (keys: Set<string>) => void;
}

function TableRoot({
  density = 'comfortable',
  striped = false,
  sticky = false,
  maxHeight,
  sortDescriptor = null,
  onSortChange,
  selectionMode = 'none',
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  className,
  style,
  children,
  ...rest
}: TableProps) {
  const isControlled = selectedKeys !== undefined;
  const [internal, setInternal] = useState<Set<string>>(() => new Set(defaultSelectedKeys ?? []));
  const selected = isControlled ? new Set(selectedKeys) : internal;

  // Rows self-register their key so the head's select-all can compute tri-state
  // against the actually-rendered rows.
  const [registry, setRegistry] = useState<Set<string>>(() => new Set());
  const registerRow = useCallback((key: string) => {
    setRegistry((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);
  const unregisterRow = useCallback((key: string) => {
    setRegistry((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const commit = (next: Set<string>): void => {
    if (!isControlled) setInternal(next);
    onSelectionChange?.(next);
  };

  let selectedInRegistry = 0;
  registry.forEach((k) => {
    if (selected.has(k)) selectedInRegistry += 1;
  });
  const allSelected = registry.size > 0 && selectedInRegistry === registry.size;
  const someSelected = selectedInRegistry > 0 && !allSelected;

  const ctx: TableContextValue = {
    density,
    sortDescriptor,
    onSortChange,
    selectionMode,
    isSelected: (key) => selected.has(key),
    toggleRow: (key) => {
      const next = new Set(selected);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      commit(next);
    },
    registerRow,
    unregisterRow,
    allSelected,
    someSelected,
    toggleAll: () => {
      const next = new Set(selected);
      if (allSelected) registry.forEach((k) => next.delete(k));
      else registry.forEach((k) => next.add(k));
      commit(next);
    },
  };

  return (
    <TableContext.Provider value={ctx}>
      <div
        className="tcl-table-scroll"
        style={maxHeight != null ? ({ maxHeight } as CSSProperties) : undefined}
      >
        <table
          className={cx(
            'tcl-table',
            density === 'compact' && 'tcl-table--compact',
            striped && 'tcl-table--striped',
            sticky && 'tcl-table--sticky',
            className,
          )}
          style={style}
          {...rest}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

// ── caption ──────────────────────────────────────────────────────────
export type TableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>;

function TableCaption({ className, children, ...rest }: TableCaptionProps) {
  return (
    <caption className={cx('tcl-table__caption', className)} {...rest}>
      {children}
    </caption>
  );
}

// ── sections ─────────────────────────────────────────────────────────
export type TableSectionProps = HTMLAttributes<HTMLTableSectionElement>;

function TableHead({ className, children, ...rest }: TableSectionProps) {
  return (
    <SectionContext.Provider value="head">
      <thead className={cx('tcl-table__head', className)} {...rest}>
        {children}
      </thead>
    </SectionContext.Provider>
  );
}

function TableBody({ className, children, ...rest }: TableSectionProps) {
  return (
    <SectionContext.Provider value="body">
      <tbody className={cx('tcl-table__body', className)} {...rest}>
        {children}
      </tbody>
    </SectionContext.Provider>
  );
}

function TableFoot({ className, children, ...rest }: TableSectionProps) {
  return (
    <SectionContext.Provider value="foot">
      <tfoot className={cx('tcl-table__foot', className)} {...rest}>
        {children}
      </tfoot>
    </SectionContext.Provider>
  );
}

// ── select-all (head) ────────────────────────────────────────────────
function SelectAllCell() {
  const { allSelected, someSelected, toggleAll } = useTableContext('Row');
  return (
    <th scope="col" className="tcl-table__th tcl-table__select">
      <Checkbox
        aria-label="Select all rows"
        checked={allSelected}
        indeterminate={someSelected}
        onChange={toggleAll}
      />
    </th>
  );
}

// ── row ──────────────────────────────────────────────────────────────
export interface TableRowProps extends Omit<HTMLAttributes<HTMLTableRowElement>, 'onClick'> {
  /** Identifies the row for selection; required when `selectionMode="multiple"`. */
  rowKey?: string;
  /** Makes the whole row a link (stretched over the row, fully keyboard-accessible). */
  href?: string;
  /** Makes the whole row a button. Ignored when `href` is set. */
  onClick?: (e: MouseEvent<HTMLElement>) => void;
}

function TableRow({ rowKey, href, onClick, className, children, ...rest }: TableRowProps) {
  const { selectionMode, isSelected, toggleRow, registerRow, unregisterRow } =
    useTableContext('Row');
  const section = useContext(SectionContext);
  const selectable = selectionMode !== 'none';
  const isBody = section === 'body';

  useEffect(() => {
    if (!selectable || !isBody || rowKey == null) return;
    registerRow(rowKey);
    return () => unregisterRow(rowKey);
  }, [selectable, isBody, rowKey, registerRow, unregisterRow]);

  const selected = selectable && isBody && rowKey != null ? isSelected(rowKey) : false;
  const interactive = isBody && (href != null || onClick != null);

  // Host the stretched link in the first body cell so the markup stays a valid
  // <td>, gets a real focusable target, and the ::after overlay covers the row.
  let content: ReactNode = children;
  if (interactive) {
    const primary: PrimaryLink = { href, onClick };
    let injected = false;
    content = Children.map(children, (child) => {
      if (!injected && isValidElement(child)) {
        injected = true;
        return cloneElement(child as ReactElement<TableCellProps>, { _primaryLink: primary });
      }
      return child;
    });
  }

  let selectCell: ReactNode = null;
  if (selectable) {
    if (section === 'head') {
      selectCell = <SelectAllCell />;
    } else if (isBody && rowKey != null) {
      selectCell = (
        <td className="tcl-table__td tcl-table__select">
          <Checkbox aria-label="Select row" checked={selected} onChange={() => toggleRow(rowKey)} />
        </td>
      );
    } else {
      selectCell = <td className="tcl-table__td tcl-table__select" aria-hidden="true" />;
    }
  }

  return (
    <tr
      className={cx('tcl-table__row', interactive && 'tcl-table__row--interactive', className)}
      data-selected={selected || undefined}
      {...rest}
    >
      {selectCell}
      {content}
    </tr>
  );
}

// ── header cell ──────────────────────────────────────────────────────
export interface TableHeaderCellProps extends Omit<
  ThHTMLAttributes<HTMLTableCellElement>,
  'align'
> {
  align?: CellAlign;
  /** Marks the column sortable; clicking emits `onSortChange({ column: sortKey, … })`. */
  sortKey?: string;
}

function TableHeaderCell({
  align = 'start',
  sortKey,
  className,
  children,
  ...rest
}: TableHeaderCellProps) {
  const { sortDescriptor, onSortChange } = useTableContext('HeaderCell');
  const sortable = sortKey != null;
  const active = sortable && sortDescriptor?.column === sortKey;
  const direction = active ? sortDescriptor!.direction : undefined;
  const ariaSort: AriaAttributes['aria-sort'] = sortable
    ? active
      ? direction === 'asc'
        ? 'ascending'
        : 'descending'
      : 'none'
    : undefined;

  const handleSort = (): void => {
    if (!sortable) return;
    const next: SortDirection = active && direction === 'asc' ? 'desc' : 'asc';
    onSortChange?.({ column: sortKey, direction: next });
  };

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cx('tcl-table__th', align !== 'start' && `tcl-table__cell--${align}`, className)}
      {...rest}
    >
      {sortable ? (
        <button
          type="button"
          className="tcl-table__sort"
          data-active={active || undefined}
          onClick={handleSort}
        >
          <span>{children}</span>
          <span
            className="tcl-table__sort-icon"
            aria-hidden="true"
            data-direction={direction ?? 'none'}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5 L6 7.5 L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      ) : (
        children
      )}
    </th>
  );
}

// ── data cell ────────────────────────────────────────────────────────
export interface TableCellProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  align?: CellAlign;
  /** Mono, tabular-nums, end-aligned — for figures. */
  numeric?: boolean;
  /** @internal injected by an interactive `Table.Row` — do not set directly. */
  _primaryLink?: PrimaryLink;
}

function TableCell({
  align,
  numeric = false,
  className,
  children,
  _primaryLink,
  ...rest
}: TableCellProps) {
  const resolved: CellAlign = align ?? (numeric ? 'end' : 'start');
  let inner: ReactNode = children;
  if (_primaryLink) {
    inner =
      _primaryLink.href != null ? (
        <a className="tcl-table__rowlink" href={_primaryLink.href}>
          {children}
        </a>
      ) : (
        <button type="button" className="tcl-table__rowlink" onClick={_primaryLink.onClick}>
          {children}
        </button>
      );
  }
  return (
    <td
      className={cx(
        'tcl-table__td',
        resolved !== 'start' && `tcl-table__cell--${resolved}`,
        numeric && 'tcl-table__cell--numeric',
        className,
      )}
      {...rest}
    >
      {inner}
    </td>
  );
}

// ── empty state ──────────────────────────────────────────────────────
export interface TableEmptyProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'colSpan'> {
  /** Number of data columns; the select column (if any) is added automatically. */
  colSpan: number;
}

function TableEmpty({ colSpan, className, children, ...rest }: TableEmptyProps) {
  const { selectionMode } = useTableContext('Empty');
  const span = colSpan + (selectionMode !== 'none' ? 1 : 0);
  return (
    <tr className="tcl-table__row">
      <td colSpan={span} className={cx('tcl-table__td tcl-table__empty', className)} {...rest}>
        {children}
      </td>
    </tr>
  );
}

/**
 * `Table` — a composable, accessible data table built on real `<table>`
 * semantics. Compound API:
 * `<Table><Table.Head><Table.Row><Table.HeaderCell/></Table.Row></Table.Head>
 *  <Table.Body><Table.Row><Table.Cell/></Table.Row></Table.Body></Table>`.
 *
 * Sortable headers emit intent (you reorder the data); `selectionMode` adds a
 * tri-state checkbox column; `href`/`onClick` on a row make the whole row a
 * stretched, keyboard-accessible link/button.
 */
export const Table = Object.assign(TableRoot, {
  Caption: TableCaption,
  Head: TableHead,
  Body: TableBody,
  Foot: TableFoot,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
  Empty: TableEmpty,
});
