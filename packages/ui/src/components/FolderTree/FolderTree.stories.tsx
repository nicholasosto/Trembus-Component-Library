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
  { id: 'claude-md', label: 'CLAUDE.md' },
  { id: 'env', label: '.env' },
];

/**
 * The library's WAI-ARIA `role="tree"` file explorer: indented folder/file rows
 * with expand/collapse, roving-tabindex keyboard navigation, an optional filter
 * box, tri-state multi-select checkboxes, and lazy-loaded children. Lead job:
 * **reveal state** — depth, open/closed, selection, and check state are all
 * perceivable at once.
 *
 * ### When to use it
 * - Hierarchical navigation and picking: project files, asset folders, scoped
 *   multi-select over a tree.
 * - Not for site navigation — use `NavBar`; not for thousands of flat tiles —
 *   use `VirtualAssetGrid`; not for node-link hierarchy *diagrams* — that's viz `Tree`.
 *
 * ### Data & key props
 * - `data: FolderNode[]` — nested nodes
 *   `{ id?, label, kind?, icon?, children?, hasChildren?, disabled? }`; omitted ids
 *   derive from position (provide them if the tree reorders). File-type glyphs infer
 *   from the extension.
 * - `label` — the tree's accessible name (default `"Files"`).
 * - Three controlled/uncontrolled trios: `expandedIds`/`defaultExpandedIds`/`onExpandedChange`,
 *   `selectedId`/`defaultSelectedId`/`onSelect(id, node)`, and `checkable` +
 *   `checkedIds`/`defaultCheckedIds`/`onCheckedChange` (folder state derives from leaves).
 * - `filter` — `true` for the built-in box, a string to drive it controlled
 *   (+ `onFilterChange`); `onLoadChildren(node)` — sync or async lazy loader.
 *
 * ### Accessibility
 * - `role="tree"` of `role="treeitem"` rows carrying `aria-level` / `aria-setsize` /
 *   `aria-posinset` / `aria-expanded` / `aria-selected` / tri-state `aria-checked`.
 * - One roving tab stop: Up/Down walk visible rows, Right/Left expand/collapse or
 *   hop to child/parent, Home/End jump, Enter selects (+ toggles folders), Space
 *   toggles the checkbox when `checkable`.
 * - Filtering highlights matches, auto-expands their ancestors, and announces the
 *   match count via a `role="status"` live region; chevron rotation stops under
 *   `prefers-reduced-motion`.
 *
 * ### Theming & setup
 * - Tokens-only styling; correct in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
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
