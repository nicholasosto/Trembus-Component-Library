import { describe, expect, it } from 'vitest';
import { applyRun } from './applyRun';
import type { SwimlaneContract } from '../components/Swimlane/Swimlane';
import type { RunRecord } from '../components/RunHistory/RunHistory';

const base: SwimlaneContract = {
  lanes: [{ id: 'you', label: 'You' }],
  steps: [
    { id: 'a', lane: 'you', label: 'A', status: 'active', note: 'authored note' },
    { id: 'b', lane: 'you', label: 'B', status: 'active' },
    { id: 'c', lane: 'you', label: 'C', status: 'done' },
  ],
};

describe('applyRun', () => {
  it('returns the base contract untouched when the run has no step outcomes', () => {
    const run: RunRecord = { status: 'queued', startedAt: '2026-07-14T00:00:00.000Z' };
    expect(applyRun(base, run)).toBe(base);
  });

  it('overwrites step statuses from the run and folds outputs into the note', () => {
    const run: RunRecord = {
      status: 'failed',
      startedAt: '2026-07-14T00:00:00.000Z',
      stepOutcomes: [
        { step: 'a', status: 'done', outputs: [{ label: 'log.txt' }, { label: 'PR #9' }] },
        { step: 'b', status: 'blocked' },
      ],
    };
    const out = applyRun(base, run);
    expect(out.steps[0]).toMatchObject({
      status: 'done',
      note: 'authored note · Output: log.txt, PR #9',
    });
    expect(out.steps[1]).toMatchObject({ status: 'blocked', note: undefined });
    // steps the run never reached fall back to pending — even when authored done
    expect(out.steps[2]).toMatchObject({ status: 'pending' });
    // pure: the base contract is never mutated
    expect(base.steps[0].status).toBe('active');
    expect(base.steps[2].status).toBe('done');
  });

  it('tolerates a missing steps array (authored-JSON leniency, mirrors Swimlane)', () => {
    const junkBase = { lanes: [], steps: undefined } as unknown as SwimlaneContract;
    const run: RunRecord = {
      status: 'succeeded',
      startedAt: '2026-07-14T00:00:00.000Z',
      stepOutcomes: [{ step: 'a', status: 'done' }],
    };
    expect(applyRun(junkBase, run).steps).toEqual([]);
  });

  it('leaves steps without ids on pending (outcomes target ids only)', () => {
    const anon: SwimlaneContract = {
      lanes: [{ label: 'You' }],
      steps: [{ lane: 'You', label: 'No id', status: 'done' }],
    };
    const run: RunRecord = {
      status: 'succeeded',
      startedAt: '2026-07-14T00:00:00.000Z',
      stepOutcomes: [{ step: 's0', status: 'done' }],
    };
    expect(applyRun(anon, run).steps[0].status).toBe('pending');
  });
});
