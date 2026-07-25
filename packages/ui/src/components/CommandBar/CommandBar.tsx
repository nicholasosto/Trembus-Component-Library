import { Fragment, useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Glyph } from '@trembus/icons';
import { useElementSize } from '../../internal/useElementSize';
import { cx } from '../../utils/cx';
import { Menu } from '../Menu/Menu';
import { Toolbar } from '../Toolbar/Toolbar';
import './CommandBar.css';

/** Emphasis for a command — `accent` is the one primary action, `danger` is destructive. */
export type CommandTone = 'neutral' | 'accent' | 'danger';

export interface Command {
  /** Stable identity — the React key and the value echoed to `onCommand`. */
  id: string;
  /** Accessible name. Icon-only commands are named by this; also the menu-row text. */
  label: string;
  /** Glyph name from the `@trembus/icons` registry (e.g. `'gear'`). Unknown names render nothing. */
  glyph?: string;
  /** Emphasis; default `neutral`. */
  tone?: CommandTone;
  /** Inert command — dimmed, skipped by the roving tab order. */
  disabled?: boolean;
  /** Toggle state → `aria-pressed` on the bar button. Ignored on a command that opens a menu. */
  pressed?: boolean;
  /** Render the label as visible text beside the glyph (bar buttons are icon-only by default). */
  showLabel?: boolean;
  /** Trailing hint on a menu row — a shortcut, target, or status word. */
  hint?: string;
  /** Nested commands → this command opens a menu instead of firing. Nesting is TWO levels (menu → submenu); a third level is not rendered. */
  commands?: Command[];
  /** Called on activation. `onCommand` on the bar fires too. */
  onSelect?: (command: Command) => void;
}

export interface CommandGroup {
  /** Stable identity — the React key and the overflow unit. */
  id: string;
  /** Accessible name of the `role="group"` cluster; also its heading in the overflow menu. */
  label: string;
  commands: Command[];
}

export interface CommandBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Accessible name of the bar (`role="toolbar"`). Required — an unnamed toolbar is unusable by screen reader. */
  label: string;
  /** The command model. Groups render as separator-divided clusters and are the unit of overflow. */
  groups: CommandGroup[];
  /** Static trailing content (a `Badge`, a count). Not interactive — it sits outside the roving tab order. */
  meta?: ReactNode;
  /** Which side menus open toward; default `top` (a docked bar opens upward). */
  side?: 'top' | 'bottom';
  /** Where the bar sits in its (full-width) root; default `start`. `center` docks it. */
  align?: 'start' | 'center' | 'end';
  /**
   * Collapse trailing groups into a "More" menu when the bar outgrows its container;
   * default `true`. The root is full-width, so this needs a width-constrained parent —
   * inside a content-sized (inline / auto) parent there is no width to fit into and the
   * bar collapses all the way.
   */
  overflow?: boolean;
  /** Accessible name of the overflow trigger; default `'More commands'`. */
  overflowLabel?: string;
  /** Render the `aria-live` readout under the bar; default `true`. */
  showStatus?: boolean;
  /** Controlled readout content. When set, the bar shows this instead of echoing the last command. */
  status?: ReactNode;
  /** Message for the uncontrolled readout; default the command's `label`. */
  formatStatus?: (command: Command) => string;
  /** Called after any command is activated (leaf commands only — opening a menu is not a command). */
  onCommand?: (command: Command) => void;
}

/**
 * Width kept in reserve for the overflow cluster (the ⋯ button, its separator and
 * gaps) when deciding how many groups fit. A constant rather than a measurement:
 * the trigger only exists once something has already collapsed, so measuring it
 * would make the first collapse depend on a node that isn't there yet. Erring
 * generous costs at most one group of eagerness and never overflows visually.
 */
const OVERFLOW_RESERVE = 56;

/** Glyph + label row shared by bar buttons and menu rows. */
function CommandFace({ command, showLabel }: { command: Command; showLabel: boolean }) {
  // Never render a nameless control: a command with no glyph falls back to text.
  const text = showLabel || !command.glyph;
  return (
    <>
      {command.glyph ? <Glyph name={command.glyph} /> : null}
      {text ? <span className="tcl-command-bar__label">{command.label}</span> : null}
    </>
  );
}

/**
 * `CommandBar` — a data-driven command dock over the `Toolbar` + `Menu` spine. One
 * `groups` model renders as separator-divided clusters of real controls under a
 * single Tab stop: a command with nested `commands` progressively discloses into a
 * menu (and one submenu), commands that no longer fit collapse into a "⋯" overflow
 * menu under their group headings, and an `aria-live` readout under the bar echoes
 * whatever was just invoked — commands act elsewhere, so the bar confirms them.
 * Reach for `Toolbar` + `Menu` directly when the commands are hand-written JSX
 * rather than data. `children` are an escape hatch appended at the end of the bar;
 * they sit outside the overflow measurement.
 */
export function CommandBar({
  label,
  groups,
  meta,
  side = 'top',
  align = 'start',
  overflow = true,
  overflowLabel = 'More commands',
  showStatus = true,
  status,
  formatStatus = (command) => command.label,
  onCommand,
  className,
  children,
  ...rest
}: CommandBarProps) {
  // `n` counts activations so the live region re-announces a command invoked twice in
  // a row: identical text is not a DOM mutation, so the keyed span has to be replaced.
  const [last, setLast] = useState<{ command: Command; n: number } | null>(null);
  const rootEl = useRef<HTMLDivElement | null>(null);
  const [setSizeRef, size] = useElementSize();
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      rootEl.current = node;
      setSizeRef(node);
    },
    [setSizeRef],
  );

  const activate = (command: Command): void => {
    if (command.disabled) return;
    command.onSelect?.(command);
    onCommand?.(command);
    setLast((prev) => ({ command, n: (prev?.n ?? 0) + 1 }));
  };

  // ── overflow: how many leading groups stay in the bar ─────────────────────
  const [visible, setVisible] = useState(groups.length);
  // Natural geometry, captured once while nothing is collapsed: each group's right
  // edge relative to the bar's left, plus the bar's own natural width. Edges (rather
  // than summed widths) fold in gaps, separators and padding for free.
  const natural = useRef<{ edges: number[]; barWidth: number } | null>(null);
  const shape = groups.map((g) => `${g.id}:${g.commands.length}`).join('|');
  const lastShape = useRef(shape);
  if (lastShape.current !== shape) {
    lastShape.current = shape;
    natural.current = null;
  }

  useLayoutEffect(() => {
    if (!overflow) {
      setVisible(groups.length);
      return;
    }
    const root = rootEl.current;
    const bar = root?.querySelector<HTMLElement>('[data-cmd-bar]');
    // No measurable width (jsdom, SSR, display:none) → show everything. Collapsing
    // on a zero measurement would hide the whole bar behind a ⋯ nobody asked for.
    const avail = size.width || root?.clientWidth || 0;
    if (!bar || avail <= 0) return;

    if (!natural.current && visible === groups.length) {
      const barRect = bar.getBoundingClientRect();
      const els = Array.from(bar.querySelectorAll<HTMLElement>('[data-cmd-group]'));
      if (els.length !== groups.length || barRect.width <= 0) return;
      natural.current = {
        edges: els.map((el) => el.getBoundingClientRect().right - barRect.left),
        barWidth: barRect.width,
      };
    }
    const nat = natural.current;
    if (!nat) return;

    // Chrome after the last group (meta slot + right padding) is always on screen.
    const trailing = nat.barWidth - (nat.edges[nat.edges.length - 1] ?? 0);
    let n = groups.length;
    while (n > 0) {
      const needed =
        (nat.edges[n - 1] ?? 0) + trailing + (n < groups.length ? OVERFLOW_RESERVE : 0);
      if (needed <= avail) break;
      n--;
    }
    if (n !== visible) setVisible(n);
  }, [overflow, groups.length, size.width, visible, shape]);

  const shown = overflow ? groups.slice(0, visible) : groups;
  const collapsed = overflow ? groups.slice(visible) : [];

  // ── renderers ─────────────────────────────────────────────────────────────
  /** A menu row: a leaf `Menu.Item`, or a `Menu.Sub` when it has children (level 1 only). */
  const renderRow = (command: Command, nested: boolean): ReactNode => {
    const face = (
      <>
        <CommandFace command={command} showLabel />
        {/* Deliberately NOT aria-hidden: a hint carries meaning ("offline", "⌘1")
            and hiding it would leave screen-reader users with less than the screen. */}
        {command.hint ? <span className="tcl-command-bar__hint">{command.hint}</span> : null}
      </>
    );
    // A submenu is Menu's deepest level, so a command nested that far renders as a
    // leaf — its own `commands` are not reachable. Documented on the prop.
    if (!nested && command.commands?.length) {
      return (
        <Menu.Sub key={command.id}>
          <Menu.SubTrigger
            disabled={command.disabled}
            data-cmd-tone={command.tone ?? 'neutral'}
            className="tcl-command-bar__row"
          >
            {face}
          </Menu.SubTrigger>
          <Menu.SubContent>{command.commands.map((c) => renderRow(c, true))}</Menu.SubContent>
        </Menu.Sub>
      );
    }
    return (
      <Menu.Item
        key={command.id}
        disabled={command.disabled}
        data-cmd-tone={command.tone ?? 'neutral'}
        className="tcl-command-bar__row"
        onSelect={() => activate(command)}
      >
        {face}
      </Menu.Item>
    );
  };

  /** A bar control: a `Toolbar.Button`, wrapped as a `Menu.Trigger` when it has children. */
  const renderCommand = (command: Command): ReactNode => {
    const tone = command.tone ?? 'neutral';
    const button = (
      <Toolbar.Button
        aria-label={command.showLabel || !command.glyph ? undefined : command.label}
        tone={tone === 'accent' ? 'accent' : 'neutral'}
        data-cmd-tone={tone}
        disabled={command.disabled}
      >
        <CommandFace command={command} showLabel={command.showLabel ?? false} />
      </Toolbar.Button>
    );

    if (command.commands?.length) {
      return (
        <Menu key={command.id}>
          <Menu.Trigger>{button}</Menu.Trigger>
          <Menu.Content side={side}>
            <Menu.Label>{command.label}</Menu.Label>
            {command.commands.map((c) => renderRow(c, false))}
          </Menu.Content>
        </Menu>
      );
    }
    return (
      <Toolbar.Button
        key={command.id}
        aria-label={command.showLabel || !command.glyph ? undefined : command.label}
        aria-pressed={command.pressed}
        tone={tone === 'accent' ? 'accent' : 'neutral'}
        data-cmd-tone={tone}
        disabled={command.disabled}
        onClick={() => activate(command)}
      >
        <CommandFace command={command} showLabel={command.showLabel ?? false} />
      </Toolbar.Button>
    );
  };

  const readout = status ?? (last ? formatStatus(last.command) : null);

  return (
    <div
      ref={setRoot}
      className={cx('tcl-command-bar', `tcl-command-bar--${align}`, className)}
      {...rest}
    >
      <Toolbar aria-label={label} data-cmd-bar="" className="tcl-command-bar__bar">
        {shown.map((group, i) => (
          <Fragment key={group.id}>
            {i > 0 ? <Toolbar.Separator /> : null}
            <Toolbar.Group aria-label={group.label} data-cmd-group={group.id}>
              {group.commands.map(renderCommand)}
            </Toolbar.Group>
          </Fragment>
        ))}

        {collapsed.length > 0 ? (
          <>
            {shown.length > 0 ? <Toolbar.Separator /> : null}
            <Menu>
              <Menu.Trigger>
                <Toolbar.Button aria-label={overflowLabel} data-cmd-overflow="">
                  <span aria-hidden>⋯</span>
                </Toolbar.Button>
              </Menu.Trigger>
              <Menu.Content side={side} align="end">
                {collapsed.map((group, i) => (
                  <Fragment key={group.id}>
                    {i > 0 ? <Menu.Separator /> : null}
                    {/* Presentational heading: Menu.Label names the whole menu, and
                        several of them would fight over that name. */}
                    <div role="presentation" className="tcl-command-bar__heading">
                      {group.label}
                    </div>
                    {group.commands.map((c) => renderRow(c, false))}
                  </Fragment>
                ))}
              </Menu.Content>
            </Menu>
          </>
        ) : null}

        {meta ? (
          <>
            <Toolbar.Separator />
            <div className="tcl-command-bar__meta">{meta}</div>
          </>
        ) : null}
        {children}
      </Toolbar>

      {showStatus ? (
        <p role="status" className="tcl-command-bar__status">
          <span key={last?.n ?? 0}>{readout}</span>
        </p>
      ) : null}
    </div>
  );
}
