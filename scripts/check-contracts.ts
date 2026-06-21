/**
 * First-principles contract checker — the CI gate that enforces the "3 jobs"
 * discipline against a SINGLE source of truth (each component's *.contract.ts).
 * It does NOT restate the rules; it validates that every component:
 *   1. has the canonical 5-file shape,
 *   2. ships a contract declaring all three irreducible UI jobs,
 *   3. has a Storybook story for each job (the contract's claim is demonstrated),
 *   4. is exported from the public barrel (src/index.ts).
 *
 * Run: pnpm check:contracts
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import type { ComponentContract } from '../src/types/contract';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = join(root, 'src', 'components');
const indexPath = join(root, 'src', 'index.ts');

const errors: string[] = [];
const ok: string[] = [];

function collectBarrelExports(): Set<string> {
  const text = readFileSync(indexPath, 'utf8');
  const names = new Set<string>();
  for (const m of text.matchAll(/export\s*\{([\s\S]*?)\}/g)) {
    for (const part of m[1].split(',')) {
      const id = part.trim().split(/\s+as\s+/)[0].trim();
      if (id) names.add(id);
    }
  }
  return names;
}

function storyExports(storiesText: string): Set<string> {
  const names = new Set<string>();
  for (const m of storiesText.matchAll(/export\s+const\s+(\w+)\s*[:=]/g)) {
    names.add(m[1]);
  }
  return names;
}

async function main(): Promise<void> {
  const barrel = collectBarrelExports();
  const dirs = readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const name of dirs) {
    const dir = join(componentsDir, name);
    const required = [
      `${name}.tsx`,
      `${name}.css`,
      `${name}.contract.ts`,
      `${name}.stories.tsx`,
      `${name}.test.tsx`,
    ];
    const missing = required.filter((f) => !existsSync(join(dir, f)));
    if (missing.length) {
      errors.push(`${name}: missing required file(s): ${missing.join(', ')}`);
      continue;
    }

    // 2. Contract presence + shape.
    const contractMod = (await import(pathToFileURL(join(dir, `${name}.contract.ts`)).href)) as {
      default?: ComponentContract;
    };
    const contract = contractMod.default;
    if (!contract) {
      errors.push(`${name}: ${name}.contract.ts has no default export`);
      continue;
    }
    const jobKeys = ['revealState', 'affordAction', 'acknowledgeInput'] as const;
    const stories = storyExports(readFileSync(join(dir, `${name}.stories.tsx`), 'utf8'));

    for (const job of jobKeys) {
      const sat = contract.jobs?.[job];
      if (!sat?.satisfiedBy || !sat?.story) {
        errors.push(`${name}: contract job "${job}" must declare satisfiedBy + story`);
        continue;
      }
      // 3. The named story must exist.
      if (!stories.has(sat.story)) {
        errors.push(
          `${name}: contract job "${job}" references story "${sat.story}" which is not exported in ${name}.stories.tsx`,
        );
      }
    }

    if (contract.name !== name) {
      errors.push(`${name}: contract.name "${contract.name}" does not match directory "${name}"`);
    }

    // 4. Public export.
    if (!barrel.has(name)) {
      errors.push(`${name}: not exported from src/index.ts`);
    }

    if (!errors.some((e) => e.startsWith(`${name}:`))) {
      ok.push(name);
    }
  }

  if (ok.length) {
    console.log(`✓ contracts valid: ${ok.join(', ')}`);
  }
  if (errors.length) {
    console.error('\n✗ contract check failed:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`\nAll ${ok.length} component contract(s) satisfy the three UI jobs.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
