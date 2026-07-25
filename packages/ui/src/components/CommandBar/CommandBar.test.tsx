import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { CommandBar } from './CommandBar';
import type { CommandBarProps, CommandGroup } from './CommandBar';

const groups: CommandGroup[] = [
  {
    id: 'tools',
    label: 'Tools',
    commands: [
      { id: 'materials', label: 'Materials', glyph: 'layers' },
      { id: 'lighting', label: 'Lighting', glyph: 'zap', pressed: true },
      { id: 'inspect', label: 'Inspect', glyph: 'search', disabled: true },
    ],
  },
  {
    id: 'bridge',
    label: 'Bridge',
    commands: [
      {
        id: 'dcc',
        label: 'DCC Bridge',
        glyph: 'sparkle',
        commands: [
          { id: 'zbrush', label: 'ZBrush', hint: '⌘1' },
          {
            id: 'roblox',
            label: 'Roblox',
            commands: [
              { id: 'roblox-send', label: 'Send' },
              { id: 'roblox-log', label: 'Send with log' },
            ],
          },
          { id: 'isaac', label: 'OV / Isaac', disabled: true, hint: 'offline' },
        ],
      },
    ],
  },
];

const Bar = (props: Partial<CommandBarProps> = {}) => (
  <CommandBar label="Scene actions" groups={groups} {...props} />
);

describe('CommandBar', () => {
  it('renders the model as a named toolbar of named groups and controls', () => {
    render(<Bar />);
    expect(screen.getByRole('toolbar', { name: 'Scene actions' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tools' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Bridge' })).toBeInTheDocument();
    // Icon-only commands are named by their label.
    expect(screen.getByRole('button', { name: 'Materials' })).toBeInTheDocument();
    // One tab stop for the whole bar.
    expect(screen.getAllByRole('button').filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });

  it('activates a leaf command, calling onSelect and onCommand and echoing it live', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onCommand = vi.fn();
    render(
      <CommandBar
        label="Scene actions"
        onCommand={onCommand}
        groups={[
          { id: 'g', label: 'G', commands: [{ id: 'materials', label: 'Materials', onSelect }] },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Materials' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'materials' }));
    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ id: 'materials' }));
    expect(screen.getByRole('status')).toHaveTextContent('Materials');
  });

  it('progressively discloses nested commands into a menu and a submenu', async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    render(<Bar onCommand={onCommand} />);

    const trigger = screen.getByRole('button', { name: 'DCC Bridge' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // The menu is titled by the owning command.
    expect(screen.getByRole('menu', { name: 'DCC Bridge' })).toBeInTheDocument();

    const sub = screen.getByRole('menuitem', { name: /Roblox/ });
    expect(sub).toHaveAttribute('aria-haspopup', 'menu');
    await user.click(sub);
    await user.click(screen.getByRole('menuitem', { name: 'Send with log' }));

    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ id: 'roblox-log' }));
    // Selecting collapses the whole tree and returns focus to the bar button.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('honours disabled commands in the bar and in a menu', async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    render(<Bar onCommand={onCommand} />);

    const inspect = screen.getByRole('button', { name: 'Inspect' });
    expect(inspect).toBeDisabled();
    // Disabled controls are skipped by the rove.
    screen.getByRole('button', { name: 'Lighting' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'DCC Bridge' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'DCC Bridge' }));
    // The hint joins the accessible name — "offline" is WHY it is unavailable, so
    // hiding it would leave a screen reader with less than the screen shows.
    const isaac = screen.getByRole('menuitem', { name: 'OV / Isaac offline' });
    expect(isaac).toHaveAttribute('aria-disabled', 'true');
    await user.click(isaac);
    expect(onCommand).not.toHaveBeenCalled();
  });

  it('maps pressed to aria-pressed and never leaves a glyphless command nameless', () => {
    render(
      <CommandBar
        label="Bar"
        groups={[
          {
            id: 'g',
            label: 'G',
            commands: [
              { id: 'lighting', label: 'Lighting', glyph: 'zap', pressed: true },
              { id: 'plain', label: 'Plain' },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Lighting' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // No glyph → the label renders as visible text rather than an unnamed icon button.
    expect(screen.getByRole('button', { name: 'Plain' })).toHaveTextContent('Plain');
  });

  it('replaces the readout node on every activation so a repeat is re-announced', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    const materials = screen.getByRole('button', { name: 'Materials' });
    await user.click(materials);
    const first = screen.getByRole('status').firstElementChild;
    await user.click(materials);
    // Same text twice is not a DOM mutation, so a live region would stay silent
    // unless the node itself is swapped.
    expect(screen.getByRole('status').firstElementChild).not.toBe(first);
    expect(screen.getByRole('status')).toHaveTextContent('Materials');
  });

  it('lets a controlled status win over the echo, and can drop the readout entirely', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Bar status="Idle" />);
    await user.click(screen.getByRole('button', { name: 'Materials' }));
    expect(screen.getByRole('status')).toHaveTextContent('Idle');

    rerender(<Bar showStatus={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps every group in the bar when width is unmeasurable (jsdom/SSR)', () => {
    render(<Bar />);
    // Collapsing on a zero measurement would hide the bar behind a ⋯ nobody asked for.
    expect(screen.queryByRole('button', { name: 'More commands' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Bridge' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Bar />);
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('has no axe violations with a menu and submenu open', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<Bar />);
    await user.click(screen.getByRole('button', { name: 'DCC Bridge' }));
    await user.click(screen.getByRole('menuitem', { name: /Roblox/ }));
    expect(await a11yViolations(baseElement)).toEqual([]);
  });
});
