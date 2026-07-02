import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Menu } from '../Menu/Menu';
import { Toolbar } from './Toolbar';

function Bar() {
  return (
    <Toolbar aria-label="Formatting">
      <Toolbar.Group aria-label="Style">
        <Toolbar.Button aria-label="Bold">B</Toolbar.Button>
        <Toolbar.Button aria-label="Italic">I</Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.Button aria-label="Comment" disabled>
        C
      </Toolbar.Button>
      <Toolbar.Button tone="accent">Share</Toolbar.Button>
    </Toolbar>
  );
}

const enabledTabbable = () =>
  screen
    .getAllByRole('button')
    .filter((b) => !(b as HTMLButtonElement).disabled && b.tabIndex === 0);

describe('Toolbar', () => {
  it('is a labelled toolbar with exactly one tab stop (the first enabled control)', () => {
    render(<Bar />);
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
    const tabbable = enabledTabbable();
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toBe(screen.getByRole('button', { name: 'Bold' }));
  });

  it('roves focus with Arrow/Home/End, skipping the disabled control and wrapping', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    const bold = screen.getByRole('button', { name: 'Bold' });
    const italic = screen.getByRole('button', { name: 'Italic' });
    const share = screen.getByRole('button', { name: 'Share' });

    bold.focus();
    await user.keyboard('{ArrowRight}');
    expect(italic).toHaveFocus();
    await user.keyboard('{End}');
    expect(share).toHaveFocus(); // Comment (disabled) is skipped
    await user.keyboard('{ArrowRight}');
    expect(bold).toHaveFocus(); // wraps to the start
    await user.keyboard('{ArrowLeft}');
    expect(share).toHaveFocus(); // wraps back to the end
    await user.keyboard('{Home}');
    expect(bold).toHaveFocus();
  });

  it('moving focus hands off the single tab stop', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    const bold = screen.getByRole('button', { name: 'Bold' });
    const italic = screen.getByRole('button', { name: 'Italic' });
    bold.focus();
    await user.keyboard('{ArrowRight}');
    expect(italic.tabIndex).toBe(0);
    expect(bold.tabIndex).toBe(-1);
  });

  it('a Toolbar.Button can double as a Menu.Trigger: it roves and opens', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar aria-label="Bar">
        <Toolbar.Button aria-label="First">1</Toolbar.Button>
        <Menu>
          <Menu.Trigger>
            <Toolbar.Button>Bridge</Toolbar.Button>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item onSelect={() => {}}>Send</Menu.Item>
          </Menu.Content>
        </Menu>
      </Toolbar>,
    );
    const trigger = screen.getByRole('button', { name: 'Bridge' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    // Roving reaches the composed trigger…
    screen.getByRole('button', { name: 'First' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(trigger).toHaveFocus();

    // …and it still opens its menu.
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('keeps the focused control as the tab stop when a sibling mounts', async () => {
    const user = userEvent.setup();
    function Dyn() {
      const [extra, setExtra] = useState(false);
      return (
        <Toolbar aria-label="Dyn">
          <Toolbar.Button aria-label="Bold">B</Toolbar.Button>
          <Toolbar.Button aria-label="Italic">I</Toolbar.Button>
          {extra && <Toolbar.Button aria-label="New">N</Toolbar.Button>}
          <Toolbar.Button aria-label="Add" onClick={() => setExtra(true)}>
            +
          </Toolbar.Button>
        </Toolbar>
      );
    }
    render(<Dyn />);
    const add = screen.getByRole('button', { name: 'Add' });
    add.focus();
    expect(add.tabIndex).toBe(0);
    await user.click(add); // mounts "New" before Add and re-renders
    expect(add).toHaveFocus();
    expect(add.tabIndex).toBe(0); // not snatched back to the first item
    expect(screen.getByRole('button', { name: 'New' }).tabIndex).toBe(-1);
    expect(screen.getByRole('button', { name: 'Bold' }).tabIndex).toBe(-1);
  });

  it('roves the vertical axis with ArrowDown/ArrowUp', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar aria-label="V" orientation="vertical">
        <Toolbar.Button aria-label="One">1</Toolbar.Button>
        <Toolbar.Button aria-label="Two">2</Toolbar.Button>
      </Toolbar>,
    );
    const one = screen.getByRole('button', { name: 'One' });
    one.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(one).toHaveFocus();
  });

  it('vertical: ArrowDown roves past a menu-trigger button rather than opening it', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar aria-label="V" orientation="vertical">
        <Menu>
          <Menu.Trigger>
            <Toolbar.Button aria-label="Bridge">B</Toolbar.Button>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item onSelect={() => {}}>X</Menu.Item>
          </Menu.Content>
        </Menu>
        <Toolbar.Button aria-label="Below">v</Toolbar.Button>
      </Toolbar>,
    );
    const trigger = screen.getByRole('button', { name: 'Bridge' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Below' })).toHaveFocus();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Bar />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
