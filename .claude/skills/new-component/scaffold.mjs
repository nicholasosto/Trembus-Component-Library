// Scaffolds a Trembus component in the canonical 5-file shape and wires the barrel.
// Usage: node .claude/skills/new-component/scaffold.mjs <Name> [--pkg ui|viz] [--lead reveal-state|afford-action|acknowledge-input]
//   --pkg ui  (default) → packages/ui/src/components, titled Components/*
//   --pkg viz           → packages/viz/src/components, titled Visualizations/*
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--'));
const leadIdx = args.indexOf('--lead');
const lead = leadIdx >= 0 ? args[leadIdx + 1] : 'reveal-state';
const pkgIdx = args.indexOf('--pkg');
const pkg = pkgIdx >= 0 ? args[pkgIdx + 1] : 'ui';

const LEADS = ['reveal-state', 'afford-action', 'acknowledge-input'];

// Per-package wiring: where the shared utilities/types/test-helper live, and the
// Storybook sidebar prefix. @trembus/viz pulls the contract + a11y helper from the
// shared @trembus/tokens package (it must not depend on @trembus/ui).
const PKG = {
  ui: {
    cx: '../../utils/cx',
    contract: '../../types/contract',
    a11y: '../../test/a11y',
    title: 'Components',
  },
  viz: {
    cx: '../../internal/cx',
    contract: '@trembus/tokens/contract',
    a11y: '@trembus/tokens/testing',
    title: 'Visualizations',
  },
};

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!name) fail('Provide a PascalCase component name, e.g. `Tag`.');
if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) fail(`Name "${name}" must be PascalCase (e.g. Tag, AvatarGroup).`);
if (!LEADS.includes(lead)) fail(`--lead must be one of: ${LEADS.join(', ')}`);
const cfg = PKG[pkg];
if (!cfg) fail(`--pkg must be one of: ${Object.keys(PKG).join(', ')}`);

const pkgRoot = join(ROOT, 'packages', pkg);
const dir = join(pkgRoot, 'src', 'components', name);
if (existsSync(dir)) fail(`packages/${pkg}/src/components/${name} already exists.`);

const camel = name[0].toLowerCase() + name.slice(1);
const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const files = {
  [`${name}.tsx`]: `import type { HTMLAttributes } from 'react';
import { cx } from '${cfg.cx}';
import './${name}.css';

export type ${name}Props = HTMLAttributes<HTMLDivElement>;

export function ${name}({ className, children, ...rest }: ${name}Props) {
  return (
    <div className={cx('tcl-${kebab}', className)} {...rest}>
      {children}
    </div>
  );
}
`,

  [`${name}.css`]: `@layer tcl.components {
  .tcl-${kebab} {
    font-family: var(--tcl-font-sans);
    color: var(--tcl-text);
  }
}
`,

  [`${name}.contract.ts`]: `import type { ComponentContract } from '${cfg.contract}';

export const ${camel}Contract: ComponentContract = {
  name: '${name}',
  leadJob: '${lead}',
  jobs: {
    revealState: { satisfiedBy: 'TODO: how it makes state perceivable.', story: 'States' },
    affordAction: { satisfiedBy: 'TODO: the visible affordance it exposes.', story: 'Default' },
    acknowledgeInput: { satisfiedBy: 'TODO: how it acknowledges input.', story: 'Interaction' },
  },
  a11y: { focusRing: false },
  tokensUsed: ['--tcl-text'],
};

export default ${camel}Contract;
`,

  [`${name}.stories.tsx`]: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { ${name} } from './${name}';

const meta = {
  title: '${cfg.title}/${name}',
  component: ${name},
} satisfies Meta<typeof ${name}>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — TODO. */
export const Default: Story = { args: { children: '${name}' } };

/** Job: Reveal State — TODO. */
export const States: Story = { args: { children: '${name} states' } };

/** Job: Acknowledge Input — TODO. */
export const Interaction: Story = { args: { children: '${name} interaction' } };
`,

  [`${name}.test.tsx`]: `import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '${cfg.a11y}';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders its children', () => {
    render(<${name}>hello</${name}>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<${name}>content</${name}>);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
`,
};

mkdirSync(dir, { recursive: true });
for (const [filename, content] of Object.entries(files)) {
  writeFileSync(join(dir, filename), content);
}

// Wire the barrel (packages/<pkg>/src/index.ts).
const indexPath = join(pkgRoot, 'src', 'index.ts');
let index = readFileSync(indexPath, 'utf8');
const exportBlock = `export { ${name} } from './components/${name}/${name}';\nexport type { ${name}Props } from './components/${name}/${name}';\n`;
if (!index.includes(`/components/${name}/${name}'`)) {
  index = index.replace(/\n*$/, '\n') + exportBlock;
  writeFileSync(indexPath, index);
}

console.log(`✓ Scaffolded packages/${pkg}/src/components/${name}/ (${Object.keys(files).length} files) and wired its barrel`);
console.log(`  Next: implement the component, fill the contract satisfiedBy + stories, then \`pnpm --filter @trembus/${pkg} validate\`.`);
