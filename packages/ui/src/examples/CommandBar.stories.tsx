// Example PAGE — a composition (Toolbar + Menu), NOT a library component. Lives in
// src/examples/ (outside src/components/) so `check:contracts` ignores it. Compose from
// the public barrel ('../index') so it exercises the same API a consumer would.
//
// The progressive-disclosure command bar from the brief: a compact icon bar (Toolbar)
// whose "DCC Bridge" button opens an upward Menu of Send-to targets, one of which
// (Roblox) opens a submenu of alternates — the accessible replacement for hover-only
// row actions.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Menu, Toolbar } from '../index';

const Glyph = ({ children }: { children: string }) => <span aria-hidden>{children}</span>;

function CommandBar() {
  const [last, setLast] = useState<string | null>(null);
  const send = (target: string) => () => setLast(target);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      {/* mock 3D viewport — the surface the bar floats over */}
      <div
        style={{
          position: 'relative',
          width: 'min(680px, 92vw)',
          height: 340,
          borderRadius: 'var(--tcl-radius-lg)',
          border: '1px solid var(--tcl-border)',
          background:
            'radial-gradient(120% 90% at 50% 0%, var(--tcl-surface-raised), var(--tcl-surface-sunken))',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 14,
            color: 'var(--tcl-text-dim)',
            fontSize: 'var(--tcl-text-sm)',
            fontFamily: 'var(--tcl-font-sans)',
          }}
        >
          Scene · viewport (mock)
        </span>

        {/* the floating command bar, docked bottom-center */}
        <div
          style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}
        >
          <Toolbar aria-label="Scene actions">
            <Toolbar.Group aria-label="Tools">
              <Toolbar.Button aria-label="Materials">
                <Glyph>🎨</Glyph>
              </Toolbar.Button>
              <Toolbar.Button aria-label="Layers">
                <Glyph>▦</Glyph>
              </Toolbar.Button>
              <Toolbar.Button aria-label="Capture">
                <Glyph>⌖</Glyph>
              </Toolbar.Button>
            </Toolbar.Group>

            <Toolbar.Separator />

            <Toolbar.Button aria-label="Share">
              <Glyph>➤</Glyph>
            </Toolbar.Button>

            <Menu>
              <Menu.Trigger>
                <Toolbar.Button aria-label="DCC Bridge">
                  <Glyph>✦</Glyph>
                  <Glyph>▾</Glyph>
                </Toolbar.Button>
              </Menu.Trigger>
              <Menu.Content side="top">
                <Menu.Label>
                  DCC Bridge <Glyph>ⓘ</Glyph>
                </Menu.Label>
                <Menu.Item onSelect={send('ZBrush')}>
                  <Glyph>🧟</Glyph> Send to ZBrush
                </Menu.Item>
                <Menu.Sub>
                  <Menu.SubTrigger>
                    <Glyph>🟩</Glyph> Send to Roblox
                  </Menu.SubTrigger>
                  <Menu.SubContent>
                    <Menu.Item onSelect={send('Roblox')}>Send</Menu.Item>
                    <Menu.Item onSelect={send('Roblox (+ download)')}>Send + download</Menu.Item>
                    <Menu.Item onSelect={send('Roblox (with log)')}>Send with log</Menu.Item>
                  </Menu.SubContent>
                </Menu.Sub>
                <Menu.Item onSelect={send('Blender')}>
                  <Glyph>🟧</Glyph> Send to Blender
                </Menu.Item>
                <Menu.Item onSelect={send('Godot')}>
                  <Glyph>🔷</Glyph> Send to Godot
                </Menu.Item>
                <Menu.Item onSelect={send('Unity')}>
                  <Glyph>⬛</Glyph> Send to Unity
                </Menu.Item>
                <Menu.Item onSelect={send('Unreal')}>
                  <Glyph>🎮</Glyph> Send to Unreal
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item disabled onSelect={() => {}}>
                  <Glyph>🟢</Glyph> Send to OV/Isaac
                </Menu.Item>
              </Menu.Content>
            </Menu>

            <Toolbar.Separator />

            <Badge tone="warning">+$20</Badge>

            <Toolbar.Separator />

            <Toolbar.Button tone="accent" aria-label="Export">
              <Glyph>⬇</Glyph>
            </Toolbar.Button>
          </Toolbar>
        </div>
      </div>

      <p
        role="status"
        style={{
          margin: 0,
          minHeight: '1.25rem',
          color: 'var(--tcl-text-dim)',
          fontSize: 'var(--tcl-text-sm)',
          fontFamily: 'var(--tcl-font-sans)',
        }}
      >
        {last
          ? `Sent to ${last}`
          : 'Open the ✦ DCC Bridge menu — → on “Send to Roblox” for alternates.'}
      </p>
    </div>
  );
}

const meta = {
  title: 'Examples/Command Bar',
  component: CommandBar,
} satisfies Meta<typeof CommandBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
