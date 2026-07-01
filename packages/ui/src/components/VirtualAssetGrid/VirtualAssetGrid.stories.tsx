import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { VirtualAssetGrid } from './VirtualAssetGrid';
import type { VirtualAssetGridProps } from './VirtualAssetGrid';

interface AssetItem {
  id: string;
  name: string;
  kind: string;
  hue: number;
}

const KINDS = ['Images', 'Audio', 'Models', 'Docs'];
const EXT: Record<string, string> = { Images: 'png', Audio: 'wav', Models: 'glb', Docs: 'md' };
const MARK: Record<string, string> = { Images: '🖼', Audio: '♪', Models: '◈', Docs: '¶' };

const ASSETS: AssetItem[] = Array.from({ length: 800 }, (_, i) => {
  const kind = KINDS[i % KINDS.length];
  return {
    id: `a${i}`,
    name: `${kind.slice(0, -1).toLowerCase()}_${String(i).padStart(3, '0')}.${EXT[kind]}`,
    kind,
    hue: (i * 47) % 360,
  };
});

function AssetTile({ asset, selected }: { asset: AssetItem; selected: boolean }): ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div
        style={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          fontSize: 22,
          color: '#fff',
          background: `linear-gradient(135deg, hsl(${asset.hue} 48% 52%), hsl(${(asset.hue + 40) % 360} 48% 42%))`,
        }}
        aria-hidden
      >
        {MARK[asset.kind]}
      </div>
      <div
        style={{
          padding: '4px 6px',
          fontSize: 11,
          fontWeight: selected ? 600 : 400,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          background: 'var(--tcl-surface-raised)',
          color: 'var(--tcl-text)',
        }}
      >
        {asset.name}
      </div>
    </div>
  );
}

const renderTile = (asset: AssetItem, { selected }: { selected: boolean }): ReactElement => (
  <AssetTile asset={asset} selected={selected} />
);

// Cast the generic component to the concrete item type so meta `args` type cleanly.
const VAG = VirtualAssetGrid as (props: VirtualAssetGridProps<AssetItem>) => ReactElement;

const meta = {
  title: 'Components/VirtualAssetGrid',
  component: VAG,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story): ReactElement => (
      <div style={{ height: 460, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    items: ASSETS,
    getKey: (a) => a.id,
    getLabel: (a) => a.name,
    renderTile,
    groupBy: (a) => a.kind,
    groupOrder: KINDS,
    minTileWidth: 150,
    aspect: 0.82,
    label: 'Project assets',
  },
} satisfies Meta<typeof VAG>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Job: Afford Action — a role=listbox of focusable role=option tiles. One tile is
 * tabbable (roving tabindex); clicking selects. 800 assets, only the visible tiles
 * are in the DOM.
 */
export const Default: Story = {};

/**
 * Job: Reveal State — sticky counted section subheads over a windowed dataset, and
 * the current selection shown as a filled tint (distinct from the focus ring). The
 * right grid is ungrouped (no subheads).
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: 460 }}>
      <VAG
        items={ASSETS}
        getKey={(a) => a.id}
        getLabel={(a) => a.name}
        renderTile={renderTile}
        groupBy={(a) => a.kind}
        groupOrder={KINDS}
        minTileWidth={130}
        aspect={0.82}
        defaultSelectedId="a5"
        label="Grouped, with a selection"
      />
      <VAG
        items={ASSETS}
        getKey={(a) => a.id}
        getLabel={(a) => a.name}
        renderTile={renderTile}
        minTileWidth={110}
        aspect={0.82}
        label="Ungrouped (no subheads)"
      />
    </div>
  ),
};

/**
 * Job: Acknowledge Input — focus a tile and use the arrow keys (Up/Down move by the
 * live column count and cross section boundaries), Home/End, PageUp/Down. Enter or
 * Space selects; the aria-live inspector announces it. Arrowing to an off-screen
 * tile scrolls it into view and focuses it.
 */
export const Interaction: Story = {
  args: { defaultSelectedId: 'a2', minTileWidth: 160 },
};
