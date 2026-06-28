import type { Meta, StoryObj } from '@storybook/react-vite';
import { FolderTree } from './FolderTree';
import type { FolderNode } from './FolderTree';

const SAMPLE: FolderNode[] = [
  {
    id: 'packages',
    label: 'packages',
    kind: 'folder',
    children: [
      {
        id: 'ui',
        label: 'ui',
        kind: 'folder',
        children: [
          {
            id: 'ui-src',
            label: 'src',
            kind: 'folder',
            children: [
              { id: 'ui-index', label: 'index.ts' },
              {
                id: 'ui-comp',
                label: 'components',
                kind: 'folder',
                children: [
                  { id: 'btn-tsx', label: 'Button.tsx' },
                  { id: 'btn-css', label: 'Button.css' },
                  { id: 'btn-stories', label: 'Button.stories.tsx' },
                ],
              },
              { id: 'ui-app', label: 'app.jsx' },
              { id: 'ui-styles', label: 'styles.css' },
            ],
          },
          { id: 'pkg-json', label: 'package.json' },
          { id: 'ui-readme', label: 'README.md' },
        ],
      },
      {
        id: 'tokens',
        label: 'tokens',
        kind: 'folder',
        children: [
          { id: 'tok-light', label: 'tokens.light.css' },
          { id: 'tok-dark', label: 'tokens.dark.css' },
        ],
      },
    ],
  },
  { id: 'index-html', label: 'index.html' },
  { id: 'workspace', label: 'pnpm-workspace.yaml' },
];

const meta = {
  title: 'Components/FolderTree',
  component: FolderTree,
  args: { data: SAMPLE, label: 'Project files' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FolderTree>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Job: Afford Action — an expandable, selectable file tree. Each row is a
 * focusable treeitem; folders expose a chevron + `aria-expanded`; the selected
 * file is tinted. File-type glyphs come for free from the extension.
 */
export const Default: Story = {
  args: {
    defaultExpandedIds: ['packages', 'ui', 'ui-src'],
    defaultSelectedId: 'btn-tsx',
  },
};

/**
 * Job: Reveal State — depth, open/closed folders, the selected row, and
 * tri-state multi-select checkboxes are all perceivable at once. `Button.tsx`
 * and `Button.css` are checked but `Button.stories.tsx` is not, so the
 * `components` (and ancestor) folders read as **mixed**; `tokens` is fully checked.
 */
export const States: Story = {
  args: {
    checkable: true,
    defaultExpandedIds: ['packages', 'ui', 'ui-src', 'ui-comp', 'tokens'],
    defaultSelectedId: 'ui-comp',
    defaultCheckedIds: ['btn-tsx', 'btn-css', 'tok-light', 'tok-dark'],
  },
};

/**
 * Job: Acknowledge Input — type in the filter to narrow the tree (matches are
 * highlighted and their ancestors auto-expand, announced via an aria-live count);
 * arrow-key navigate, Space to check (watch parents flip to mixed). `node_modules`
 * loads its children lazily on first expand — a spinner shows, then the children
 * appear (and they lazy-load further).
 */
export const Interaction: Story = {
  args: {
    checkable: true,
    filter: true,
    defaultExpandedIds: ['packages', 'ui'],
    data: [
      ...SAMPLE,
      { id: 'node_modules', label: 'node_modules', kind: 'folder', hasChildren: true },
    ],
    onLoadChildren: (node) =>
      new Promise<FolderNode[]>((resolve) =>
        setTimeout(
          () =>
            resolve(
              node.label === 'node_modules'
                ? [
                    { label: 'react', kind: 'folder', hasChildren: true },
                    { label: 'lodash', kind: 'folder', hasChildren: true },
                    { label: '.package-lock.json' },
                  ]
                : [{ label: 'index.js' }, { label: 'package.json' }, { label: 'LICENSE' }],
            ),
          600,
        ),
      ),
  },
};
