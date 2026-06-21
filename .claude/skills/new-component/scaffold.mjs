// Scaffolds a @trembus/ui component in the canonical 5-file shape and wires the barrel.
// Usage: node .claude/skills/new-component/scaffold.mjs <Name> [--lead reveal-state|afford-action|acknowledge-input]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--'));
const leadIdx = args.indexOf('--lead');
const lead = leadIdx >= 0 ? args[leadIdx + 1] : 'reveal-state';

const LEADS = ['reveal-state', 'afford-action', 'acknowledge-input'];

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!name) fail('Provide a PascalCase component name, e.g. `Tag`.');
if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) fail(`Name "${name}" must be PascalCase (e.g. Tag, AvatarGroup).`);
if (!LEADS.includes(lead)) fail(`--lead must be one of: ${LEADS.join(', ')}`);

const dir = join(ROOT, 'src', 'components', name);
if (existsSync(dir)) fail(`src/components/${name} already exists.`);

const camel = name[0].toLowerCase() + name.slice(1);
const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const files = {
  [`${name}.tsx`]: `import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
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

  [`${name}.contract.ts`]: `import type { ComponentContract } from '../../types/contract';

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
  title: 'Components/${name}',
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
import { a11yViolations } from '../../test/a11y';
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

// Wire the barrel (src/index.ts).
const indexPath = join(ROOT, 'src', 'index.ts');
let index = readFileSync(indexPath, 'utf8');
const exportBlock = `export { ${name} } from './components/${name}/${name}';\nexport type { ${name}Props } from './components/${name}/${name}';\n`;
if (!index.includes(`/components/${name}/${name}'`)) {
  index = index.replace(/\n*$/, '\n') + exportBlock;
  writeFileSync(indexPath, index);
}

console.log(`✓ Scaffolded src/components/${name}/ (${Object.keys(files).length} files) and wired src/index.ts`);
console.log('  Next: implement the component, fill the contract satisfiedBy + stories, then `pnpm run validate`.');
