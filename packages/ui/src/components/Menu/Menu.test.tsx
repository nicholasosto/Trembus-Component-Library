import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Button } from '../Button/Button';
import { Menu } from './Menu';

function Example({ onEdit = () => {} }: { onEdit?: () => void }) {
  return (
    <Menu>
      <Menu.Trigger>
        <Button>Options</Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item onSelect={onEdit}>Edit</Menu.Item>
        <Menu.Item onSelect={() => {}}>Duplicate</Menu.Item>
        <Menu.Item onSelect={() => {}} disabled>
          Archive
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}

function WithSub({ onSend = () => {} }: { onSend?: () => void }) {
  return (
    <Menu>
      <Menu.Trigger>
        <Button>Bridge</Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Label>DCC Bridge</Menu.Label>
        <Menu.Item onSelect={() => {}}>Send to ZBrush</Menu.Item>
        <Menu.Sub>
          <Menu.SubTrigger>Send to Roblox</Menu.SubTrigger>
          <Menu.SubContent>
            <Menu.Item onSelect={onSend}>Send</Menu.Item>
            <Menu.Item onSelect={() => {}}>Send + download</Menu.Item>
          </Menu.SubContent>
        </Menu.Sub>
        <Menu.Separator />
        <Menu.Item onSelect={() => {}} disabled>
          Send to OV/Isaac
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}

/**
 * jsdom reports 0 for every layout metric, so we can't exercise the submenu's
 * collision flip for real. Instead stub the two measurements MenuSubContent reads
 * — the subtrigger's rect (`getBoundingClientRect`) and the submenu's width
 * (`offsetWidth`) — to place the trigger at a given right edge, then assert the
 * `.tcl-menu--sub-left` class toggles. Returns a restore fn for the caller's finally.
 */
function mockSubLayout({
  subTriggerRight,
  subTriggerWidth = 180,
  subWidth,
}: {
  subTriggerRight: number;
  subTriggerWidth?: number;
  subWidth: number;
}): () => void {
  const origGBCR = Element.prototype.getBoundingClientRect;
  const origOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

  Element.prototype.getBoundingClientRect = function (this: Element): DOMRect {
    // Only the subtrigger row (role=menuitem + aria-haspopup=menu) gets a real rect;
    // the root <button> trigger (role=button) and everything else stay at the origin.
    if (this.getAttribute('role') === 'menuitem' && this.getAttribute('aria-haspopup') === 'menu') {
      const left = subTriggerRight - subTriggerWidth;
      return {
        x: left,
        y: 100,
        left,
        right: subTriggerRight,
        top: 100,
        bottom: 130,
        width: subTriggerWidth,
        height: 30,
        toJSON: () => ({}),
      } as DOMRect;
    }
    return {
      x: 0,
      y: 0,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    } as DOMRect;
  };

  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement): number {
      return this.classList?.contains('tcl-menu--sub') ? subWidth : 0;
    },
  });

  return () => {
    Element.prototype.getBoundingClientRect = origGBCR;
    if (origOffsetWidth)
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', origOffsetWidth);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetWidth;
  };
}

/** Pick the submenu (vs. the root menu) out of screen.getAllByRole('menu'). */
const isSubMenu = (m: HTMLElement): boolean => m.classList.contains('tcl-menu--sub');

describe('Menu', () => {
  it('opens on trigger click and exposes the menu', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Options' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('selects an item: calls onSelect, closes, returns focus to trigger', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<Example onEdit={onEdit} />);
    const trigger = screen.getByRole('button', { name: 'Options' });
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Options' });
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('moves focus among items with ArrowDown (first item focused on open)', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
  });

  it('a Menu.Label names the menu', async () => {
    const user = userEvent.setup();
    render(<WithSub />);
    await user.click(screen.getByRole('button', { name: 'Bridge' }));
    expect(screen.getByRole('menu', { name: 'DCC Bridge' })).toBeInTheDocument();
  });

  it('opens a submenu with ArrowRight and focuses its first item', async () => {
    const user = userEvent.setup();
    render(<WithSub />);
    await user.click(screen.getByRole('button', { name: 'Bridge' }));
    expect(screen.getByRole('menuitem', { name: 'Send to ZBrush' })).toHaveFocus();
    await user.keyboard('{ArrowDown}'); // → the "Send to Roblox" subtrigger
    expect(screen.getByRole('menuitem', { name: 'Send to Roblox' })).toHaveFocus();
    await user.keyboard('{ArrowRight}'); // opens the submenu
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    expect(screen.getByRole('menuitem', { name: 'Send' })).toHaveFocus();
  });

  it('ArrowLeft closes the submenu and returns focus to the subtrigger', async () => {
    const user = userEvent.setup();
    render(<WithSub />);
    await user.click(screen.getByRole('button', { name: 'Bridge' }));
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    await user.keyboard('{ArrowLeft}');
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(screen.getByRole('menuitem', { name: 'Send to Roblox' })).toHaveFocus();
  });

  it('selecting a submenu item collapses the whole tree and refocuses the trigger', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<WithSub onSend={onSend} />);
    const trigger = screen.getByRole('button', { name: 'Bridge' });
    await user.click(trigger);
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Send' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('Tab collapses the whole tree even from inside a submenu', async () => {
    const user = userEvent.setup();
    render(<WithSub />);
    await user.click(screen.getByRole('button', { name: 'Bridge' }));
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    await user.keyboard('{Tab}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('flips the submenu to the left when opening right would overflow the viewport', async () => {
    const user = userEvent.setup();
    // Subtrigger flush against the right edge; a 220px submenu can't fit to its right.
    const restore = mockSubLayout({ subTriggerRight: window.innerWidth - 10, subWidth: 220 });
    try {
      render(<WithSub />);
      await user.click(screen.getByRole('button', { name: 'Bridge' }));
      await user.keyboard('{ArrowDown}{ArrowRight}'); // focus subtrigger, open submenu
      const sub = screen.getAllByRole('menu').find(isSubMenu);
      expect(sub).toBeTruthy();
      expect(sub).toHaveClass('tcl-menu--sub-left');
    } finally {
      restore();
    }
  });

  it('keeps the submenu opening right when there is room', async () => {
    const user = userEvent.setup();
    // Subtrigger far from the right edge; the submenu fits to its right → no flip.
    const restore = mockSubLayout({ subTriggerRight: 300, subWidth: 120 });
    try {
      render(<WithSub />);
      await user.click(screen.getByRole('button', { name: 'Bridge' }));
      await user.keyboard('{ArrowDown}{ArrowRight}');
      const sub = screen.getAllByRole('menu').find(isSubMenu);
      expect(sub).toBeTruthy();
      expect(sub).not.toHaveClass('tcl-menu--sub-left');
    } finally {
      restore();
    }
  });

  it('has no axe violations when open', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(await a11yViolations(baseElement)).toEqual([]);
  });

  it('has no axe violations with a titled menu and an open submenu', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<WithSub />);
    await user.click(screen.getByRole('button', { name: 'Bridge' }));
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(await a11yViolations(baseElement)).toEqual([]);
  });
});
