import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { sessionToBrief } from './sessionToBrief';
import { Brief } from '../../index';
import type { BriefItem, BriefSection } from '../../index';
import {
  asCompletedSession,
  psCompletedSession,
  psShelvedSession,
  rdsActiveSession,
  syntheticBlockedSession,
} from './sessions.fixture';

type Item = Exclude<BriefItem, string>;
const items = (s: BriefSection | undefined): Item[] => (s?.items ?? []) as Item[];
const section = (r: ReturnType<typeof sessionToBrief>, id: string): BriefSection | undefined =>
  r.data.sections.find((s) => s.id === id);
const pill = (r: ReturnType<typeof sessionToBrief>, label: string) =>
  r.data.meta?.find((m) => m.label === label);

describe('sessionToBrief — frontmatter → header', () => {
  it('maps title, id, kind, and the lifecycle pills', () => {
    const r = sessionToBrief(rdsActiveSession.markdown, {
      id: rdsActiveSession.id,
      space: rdsActiveSession.space,
    });
    expect(r.data.kind).toBe('session');
    expect(r.data.id).toBe(rdsActiveSession.id);
    expect(r.data.title).toBe('TGL flow and structure — nail the concepts');
    expect(pill(r, 'status')).toMatchObject({ value: 'active', tone: 'var(--tcl-accent)' });
    expect(pill(r, 'updated')?.value).toBe('2026-07-24');
    expect(pill(r, 'last active')?.value).toBe('2026-07-24 09:22');
    expect(pill(r, 'space')?.value).toBe('Roblox-Development-Studio');
    expect(pill(r, 'kos')?.value).toBe('decisions · soul-steel · dashboards · studio-mcp');
  });

  it('tones the status pill per lifecycle state', () => {
    expect(pill(sessionToBrief(psCompletedSession.markdown), 'status')?.tone).toBe(
      'var(--tcl-status-success)',
    );
    expect(pill(sessionToBrief(syntheticBlockedSession.markdown), 'status')?.tone).toBe(
      'var(--tcl-status-danger)',
    );
    expect(pill(sessionToBrief(psShelvedSession.markdown), 'status')?.tone).toBe(
      'var(--tcl-status-warning)',
    );
  });

  it('lifts the Goal into the header summary (no Goal section)', () => {
    const r = sessionToBrief(psCompletedSession.markdown);
    expect(r.data.summary).toMatch(/^Close out a deep review of the command surface/);
    expect(r.data.sections.some((s) => s.heading === 'Goal')).toBe(false);
  });

  it('cleans inline markdown out of lead prose (the *before* regression)', () => {
    const r = sessionToBrief(rdsActiveSession.markdown);
    expect(r.data.summary).toContain('before executing any mechanics');
    expect(r.data.summary).not.toMatch(/[*`[\]]/);
  });

  it('surfaces a status-line annotation as a note pill (shelved stub)', () => {
    const r = sessionToBrief(psShelvedSession.markdown);
    expect(pill(r, 'note')?.value).toMatch(/empty stub/);
  });
});

describe('sessionToBrief — section sub-components', () => {
  it('Success Criteria → checklist: success once completed, info while in flight', () => {
    const done = section(sessionToBrief(psCompletedSession.markdown), 'criteria');
    expect(done?.kind).toBe('checklist');
    expect(items(done).every((it) => it.severity === 'success')).toBe(true);

    const live = section(sessionToBrief(rdsActiveSession.markdown), 'criteria');
    expect(items(live).every((it) => it.severity === 'info')).toBe(true);
  });

  it('Source References → reference rows with pointer chips', () => {
    const refs = section(sessionToBrief(psCompletedSession.markdown), 'references');
    expect(refs?.kind).toBe('reference');
    const first = items(refs)[0];
    expect(first.text).toBe('Port pipeline');
    expect(first.ref).toBe('../pipeline/port-session-lifecycle-self-improvement-bridge.md');
    expect(first.desc).toMatch(/lifecycle \+ bridge build record/);
  });

  it('wiki-link references become chips too', () => {
    const refs = section(sessionToBrief(rdsActiveSession.markdown), 'references');
    expect(items(refs).some((it) => it.ref === '0011-tgl-package-vs-syncback-boundary')).toBe(true);
  });

  it('Decisions → decisions kind; bold leads split into lead → resolution', () => {
    const dec = section(sessionToBrief(rdsActiveSession.markdown), 'decisions');
    expect(dec?.kind).toBe('decisions');
    const blessed = items(dec).find((it) => it.text.startsWith('Grand package blessed'));
    expect(blessed?.choice).toMatch(/^TGL is one package/);
    // a bullet with no bold lead keeps its full text, no arrow
    const plain = items(dec).find((it) => it.text.startsWith('Operator deleted'));
    expect(plain?.choice).toBeUndefined();
  });

  it("First-Principles Candidates → the records' own observation → disposition grammar", () => {
    const fp = section(sessionToBrief(psCompletedSession.markdown), 'first-principles');
    expect(fp?.kind).toBe('decisions');
    const dispositions = items(fp).map((it) => it.choice);
    expect(dispositions).toContain('routine');
    expect(dispositions.some((d) => d?.startsWith('decision'))).toBe(true);
  });

  it('strips the "candidate home:" prefix from dispositions (Asset-Studio dialect)', () => {
    const fp = section(sessionToBrief(asCompletedSession.markdown), 'first-principles');
    const dispositions = items(fp).map((it) => it.choice ?? '');
    expect(dispositions.some((d) => /^candidate home:/i.test(d))).toBe(false);
    expect(dispositions.some((d) => /^decision/.test(d))).toBe(true);
  });

  it('Outputs → artifacts with pointer chips', () => {
    const out = section(sessionToBrief(psCompletedSession.markdown), 'outputs');
    expect(out?.kind).toBe('artifacts');
    const adr = items(out).find((it) => it.text === 'ADR 0017');
    expect(adr?.ref).toMatch(/^\.\.\/decisions\/0017-/);
  });

  it('Blockers: a lone "none" is a success all-clear; real blockers are danger', () => {
    const clear = section(sessionToBrief(psCompletedSession.markdown), 'blockers');
    expect(items(clear)).toEqual([{ text: 'none', severity: 'success' }]);

    const blocked = section(sessionToBrief(syntheticBlockedSession.markdown), 'blockers');
    expect(items(blocked)).toHaveLength(2);
    expect(items(blocked).every((it) => it.severity === 'danger')).toBe(true);
  });

  it('Next Action: warn spotlight while live, info once closed; prose becomes the single row', () => {
    const live = section(sessionToBrief(syntheticBlockedSession.markdown), 'next-action');
    expect(items(live)).toEqual([
      {
        text: 'Move the heartbeat emit path under previews/ (or add the copy step) and re-run the tile against a live Studio session.',
        severity: 'warn',
      },
    ]);
    const closed = section(sessionToBrief(psCompletedSession.markdown), 'next-action');
    expect(items(closed)[0].severity).toBe('info');
  });

  it('Handoff Notes → prose body with paragraph breaks preserved', () => {
    const handoff = section(sessionToBrief(psCompletedSession.markdown), 'handoff');
    expect(handoff?.kind).toBe('prose');
    expect(handoff?.body?.split('\n\n').length).toBeGreaterThanOrEqual(3);
  });

  it('chips only LEADING code spans — mid-sentence mentions stay plain text', () => {
    const r = sessionToBrief(asCompletedSession.markdown);
    const drift = items(section(r, 'outputs')).find((it) => it.text.startsWith('Drift reconcile'));
    expect(drift?.ref).toBeUndefined(); // `graph.json` mid-sentence is a mention
    expect(items(section(r, 'references'))[0].ref).toBe('CLAUDE.md'); // leading span still chips
  });

  it('an ad-hoc extra section degrades to reference rows, never breaks', () => {
    const r = sessionToBrief(asCompletedSession.markdown);
    const extra = r.data.sections.find((s) => s.heading?.startsWith('Owner calls'));
    expect(extra).toBeDefined();
    expect(extra?.kind).toBe('reference');
  });
});

describe('sessionToBrief — in-flight machinery', () => {
  it('scaffold placeholders → pending note + the filled progress pill', () => {
    const r = sessionToBrief(rdsActiveSession.markdown);
    expect(r.pending).toEqual(['outputs', 'blockers', 'next-action', 'handoff']);
    expect(pill(r, 'filled')?.value).toBe('5/9 sections');
    const outputs = section(r, 'outputs');
    expect(outputs?.note).toMatch(/Not yet recorded/);
    expect(outputs?.items).toEqual([]);
  });

  it('a fully-filled record shows no filled pill and no pending', () => {
    const r = sessionToBrief(psCompletedSession.markdown);
    expect(r.pending).toEqual([]);
    expect(pill(r, 'filled')).toBeUndefined();
  });

  it('auto-collapse folds the historical middle of closed sessions, keeps live ones open', () => {
    expect(sessionToBrief(psCompletedSession.markdown).defaultCollapsed).toEqual([
      'references',
      'decisions',
      'first-principles',
    ]);
    expect(sessionToBrief(rdsActiveSession.markdown).defaultCollapsed).toEqual(['references']);
    expect(
      sessionToBrief(psCompletedSession.markdown, { collapse: 'none' }).defaultCollapsed,
    ).toEqual([]);
  });

  it('renders through Brief with no axe violations (in-flight doc, all indicator states)', async () => {
    const { data, defaultCollapsed } = sessionToBrief(rdsActiveSession.markdown, {
      id: rdsActiveSession.id,
      space: rdsActiveSession.space,
    });
    const { container } = render(<Brief data={data} defaultCollapsed={defaultCollapsed} />);
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('typed frontmatter links join Source References with their rel as the status chip', () => {
    const md = [
      '---',
      'title: "Linked session"',
      'status: completed',
      'updated: 2026-07-01',
      'links:',
      '  - { rel: decided-in, target: decisions/0002-adopt-medium }',
      '---',
      '',
      '## Source References',
      '',
      '- `CLAUDE.md` — the status log',
    ].join('\n');
    const refs = section(sessionToBrief(md), 'references');
    expect(items(refs)).toContainEqual({
      text: '0002-adopt-medium',
      ref: 'decisions/0002-adopt-medium',
      status: 'decided-in',
    });
  });
});
