import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Brief, parseBrief, fromMarkdown } from './Brief';
import type { BriefContract } from './Brief';

const doc: BriefContract = {
  view: 'brief',
  kind: 'claude',
  id: 'claude.test',
  title: 'Test guide',
  summary: 'A tiny brief.',
  sections: [
    { heading: 'Commands', kind: 'commands', items: [{ text: 'pnpm dev', desc: 'storybook' }] },
    { heading: 'Conventions', kind: 'rules', items: ['Tokens only.', 'import type.'] },
  ],
};

describe('Brief', () => {
  it('reveals the title and section content', () => {
    render(<Brief data={doc} />);
    expect(screen.getByRole('heading', { name: 'Test guide', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Commands', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('pnpm dev')).toBeInTheDocument();
  });

  it('supports a custom title rank and caps section headings at h6', () => {
    const { rerender } = render(<Brief data={doc} headingLevel={1} />);
    expect(screen.getByRole('heading', { name: 'Test guide', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Commands', level: 2 })).toBeInTheDocument();

    rerender(<Brief data={doc} headingLevel={6} />);
    expect(screen.getByRole('heading', { name: 'Test guide', level: 6 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Commands', level: 6 })).toBeInTheDocument();
  });

  it('coerces bare-string items to text', () => {
    render(<Brief data={doc} />);
    // 'Tokens only.' was authored as a plain string, not { text }.
    expect(screen.getByText('Tokens only.')).toBeInTheDocument();
  });

  it('toggles a section via its disclosure button', () => {
    render(<Brief data={doc} />);
    const toggle = screen.getByRole('button', { name: 'Commands' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('degrades an unknown kind to prose (lenient render)', () => {
    render(
      <Brief
        data={{ sections: [{ heading: 'Mystery', kind: 'wat' as never, items: ['still shows'] }] }}
      />,
    );
    expect(screen.getByText('still shows')).toBeInTheDocument();
  });

  it('renders with only the minimum (no sections)', () => {
    render(<Brief data={{ title: 'Bare' }} />);
    expect(screen.getByText('No sections.')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Brief data={doc} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});

describe('parseBrief', () => {
  it('accepts a valid contract with zero issues', () => {
    const r = parseBrief(doc);
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
    expect(r.data.title).toBe('Test guide');
  });

  it('coerces string items into objects in the returned data', () => {
    const r = parseBrief({
      view: 'brief',
      sections: [{ heading: 'R', kind: 'rules', items: ['a', 'b'] }],
    });
    expect(r.data.sections[0].items).toEqual([{ text: 'a' }, { text: 'b' }]);
  });

  it('defaults a missing view to "brief" with a warning', () => {
    const r = parseBrief({ sections: [] });
    expect(r.data.view).toBe('brief');
    expect(r.issues.some((i) => i.path === 'view' && i.level === 'warn')).toBe(true);
  });

  it('flags an unknown section kind with a didYouMean (and still renders)', () => {
    const r = parseBrief({ view: 'brief', sections: [{ heading: 'X', kind: 'command' }] });
    const issue = r.issues.find((i) => i.path === 'sections[0].kind');
    expect(issue?.didYouMean).toBe('commands');
    expect(r.ok).toBe(true); // unknown kind is info, not error
  });

  it('suggests the nearest kind for a typo', () => {
    const r = parseBrief({ view: 'brief', kind: 'claud', sections: [] });
    expect(r.issues.find((i) => i.path === 'kind')?.didYouMean).toBe('claude');
  });

  it('never throws on garbage; returns a renderable shell + error', () => {
    const r = parseBrief(42);
    expect(r.ok).toBe(false);
    expect(r.data).toEqual({ view: 'brief', sections: [] });
    expect(r.issues[0].level).toBe('error');
  });

  it('parses a JSON string', () => {
    const r = parseBrief(JSON.stringify(doc));
    expect(r.ok).toBe(true);
    expect(r.data.sections).toHaveLength(2);
  });

  it('reports an error for non-array sections', () => {
    const r = parseBrief({ view: 'brief', sections: 'nope' });
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.path === 'sections' && i.level === 'error')).toBe(true);
  });
});

describe('fromMarkdown', () => {
  const sample = [
    '# Sample Guide',
    '',
    'A short intro paragraph.',
    '',
    '## Commands',
    '',
    '- `pnpm dev` — start the server',
    '- `pnpm test` — run tests',
    '',
    '## Conventions',
    '',
    '- Tokens only.',
    '- Use import type.',
    '',
    '## Gotchas',
    '',
    '- Watch out for portals.',
    '',
    '## Notes',
    '',
    'Just a paragraph, no list.',
  ].join('\n');

  it('maps the H1 to the title and the intro to the summary', () => {
    const c = fromMarkdown(sample);
    expect(c.title).toBe('Sample Guide');
    expect(c.summary).toBe('A short intro paragraph.');
  });

  it('infers section kinds from content and heading', () => {
    const byHeading = Object.fromEntries(
      fromMarkdown(sample).sections.map((s) => [s.heading, s.kind]),
    );
    expect(byHeading['Commands']).toBe('commands'); // leading inline code
    expect(byHeading['Conventions']).toBe('rules'); // plain bullets
    expect(byHeading['Gotchas']).toBe('checklist'); // heading hint
    expect(byHeading['Notes']).toBe('prose'); // no list
  });

  it('splits "term — desc" command items', () => {
    const commands = fromMarkdown(sample).sections.find((s) => s.heading === 'Commands');
    expect(commands?.items?.[0]).toEqual({ text: 'pnpm dev', desc: 'start the server' });
  });

  it('round-trips cleanly through parseBrief (no errors)', () => {
    const r = parseBrief(fromMarkdown(sample));
    expect(r.issues.filter((i) => i.level === 'error')).toEqual([]);
  });

  it("renders this repo's real CLAUDE.md deterministically", () => {
    // Resolve the workspace-root CLAUDE.md relative to THIS file (not cwd) so
    // the test is independent of where the runner is invoked from (the package
    // lives at packages/ui; CLAUDE.md stays at the repo root, five levels up).
    const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../../..');
    const md = readFileSync(join(repoRoot, 'CLAUDE.md'), 'utf8');
    const c = fromMarkdown(md);
    expect(c.title?.toLowerCase()).toContain('trembus');
    expect(c.sections.find((s) => s.heading === 'Commands')?.kind).toBe('commands');
    expect(c.sections.length).toBeGreaterThan(3);
  });
});
