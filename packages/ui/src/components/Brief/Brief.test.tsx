import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

  it('renders the success severity as a met-state check row', () => {
    render(
      <Brief
        data={{
          sections: [
            { heading: 'Gate', kind: 'checklist', items: [{ text: 'met', severity: 'success' }] },
          ],
        }}
      />,
    );
    expect(screen.getByText('met').closest('li')).toHaveAttribute('data-severity', 'success');
  });

  it('knows the session kind (label + accent hook)', () => {
    render(<Brief data={{ kind: 'session', title: 'Work log' }} />);
    expect(screen.getByText('Session')).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveAttribute('data-kind', 'session');
  });
});

// jsdom has no ResizeObserver — mock one we can drive with a chosen content-box size.
let observers: Array<{ cb: ResizeObserverCallback }> = [];
class MockResizeObserver {
  cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    observers.push({ cb: this.cb });
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    observers = observers.filter((o) => o.cb !== this.cb);
  }
}
function fireResize(width: number, height: number): void {
  act(() => {
    for (const { cb } of observers) {
      cb([{ contentRect: { width, height } } as ResizeObserverEntry], {} as ResizeObserver);
    }
  });
}

/**
 * Fire a pointer event carrying a real `clientX`. jsdom's pointer-event
 * constructor drops `clientX` from `fireEvent`'s init (the drag would then
 * commit NaN), so force it onto a constructed native event before dispatch.
 */
function firePointer(
  el: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  clientX: number,
  pointerId = 1,
): void {
  const evt = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(evt, 'clientX', { value: clientX, configurable: true });
  Object.defineProperty(evt, 'pointerId', { value: pointerId, configurable: true });
  fireEvent(el, evt);
}

/** Force `getComputedStyle(article).direction` to 'rtl' while delegating everything else. */
function mockRtl(article: HTMLElement): void {
  const orig = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
    const cs = orig(el, pseudo ?? undefined);
    if (el !== article) return cs;
    return new Proxy(cs, {
      get: (t, p) => (p === 'direction' ? 'rtl' : Reflect.get(t, p)),
    }) as CSSStyleDeclaration;
  });
}

/** jsdom rects are zero-size; give the article and its container real boxes for drag math. */
function mockRects(
  article: HTMLElement,
  opts: { left: number; width: number; container: number },
): void {
  vi.spyOn(article, 'getBoundingClientRect').mockReturnValue({
    x: opts.left,
    y: 0,
    left: opts.left,
    top: 0,
    right: opts.left + opts.width,
    bottom: 400,
    width: opts.width,
    height: 400,
    toJSON: () => ({}),
  } as DOMRect);
  const parent = article.parentElement as HTMLElement;
  vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: opts.container,
    bottom: 800,
    width: opts.container,
    height: 800,
    toJSON: () => ({}),
  } as DOMRect);
}

describe('Brief resizing', () => {
  beforeAll(() => {
    // jsdom doesn't implement pointer capture (and can throw for synthetic pointer
    // ids); stub to inert no-ops so the handle's capture calls don't blow up.
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
      configurable: true,
      writable: true,
      value: () => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
      configurable: true,
      writable: true,
      value: () => undefined,
    });
  });
  beforeEach(() => {
    observers = [];
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
  });
  afterEach(() => {
    delete (globalThis as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    vi.restoreAllMocks();
  });

  const resizableProps = { resizable: true, defaultWidth: 560, minWidth: 400, maxWidth: 900 };

  it('renders no handle, no resize attributes, and no inline width by default', () => {
    const { container } = render(<Brief data={doc} />);
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(article).not.toHaveAttribute('data-resizable');
    expect(article).not.toHaveAttribute('id');
    expect(article.style.getPropertyValue('--tcl-brief-width')).toBe('');
  });

  it('exposes the APG window-splitter surface', () => {
    const { container } = render(<Brief data={doc} {...resizableProps} />);
    const handle = screen.getByRole('separator', { name: 'Resize document — Test guide' });
    expect(handle).toHaveAttribute('tabindex', '0');
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('aria-valuemin', '400');
    expect(handle).toHaveAttribute('aria-valuemax', '900');
    expect(handle).toHaveAttribute('aria-valuenow', '560');
    expect(handle).toHaveAttribute('aria-valuetext', '560 pixels');
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    expect(article).toHaveAttribute('data-resizable');
    expect(handle.getAttribute('aria-controls')).toBe(article.id);
    expect(article.style.getPropertyValue('--tcl-brief-width')).toBe('560px');
  });

  it('steps with arrows (Shift for the large step), Home/End to the bounds', () => {
    const onWidthChange = vi.fn();
    render(<Brief data={doc} {...resizableProps} onWidthChange={onWidthChange} />);
    const handle = screen.getByRole('separator');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle).toHaveAttribute('aria-valuenow', '576');
    expect(onWidthChange).toHaveBeenLastCalledWith(576);
    fireEvent.keyDown(handle, { key: 'ArrowRight', shiftKey: true });
    expect(handle).toHaveAttribute('aria-valuenow', '640');
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(handle).toHaveAttribute('aria-valuenow', '624');
    fireEvent.keyDown(handle, { key: 'Home' });
    expect(handle).toHaveAttribute('aria-valuenow', '400');
    // jsdom's parent rect is zero-size → the container guard falls back to maxWidth.
    fireEvent.keyDown(handle, { key: 'End' });
    expect(handle).toHaveAttribute('aria-valuenow', '900');
    expect(onWidthChange).toHaveBeenLastCalledWith(900);
  });

  it('resets to defaultWidth on Enter and on double-click', () => {
    const onWidthChange = vi.fn();
    render(<Brief data={doc} {...resizableProps} onWidthChange={onWidthChange} />);
    const handle = screen.getByRole('separator');
    fireEvent.keyDown(handle, { key: 'ArrowRight', shiftKey: true });
    expect(handle).toHaveAttribute('aria-valuenow', '624');
    fireEvent.keyDown(handle, { key: 'Enter' });
    expect(handle).toHaveAttribute('aria-valuenow', '560');
    expect(onWidthChange).toHaveBeenLastCalledWith(560);
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    fireEvent.doubleClick(handle);
    expect(handle).toHaveAttribute('aria-valuenow', '560');
  });

  it('drags: origin at the article edge, live commits, release clears data-dragging', () => {
    const { container } = render(<Brief data={doc} {...resizableProps} />);
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    mockRects(article, { left: 100, width: 560, container: 1000 });
    const handle = screen.getByRole('separator');
    firePointer(handle, 'pointerdown', 660);
    expect(article).toHaveAttribute('data-dragging');
    firePointer(handle, 'pointermove', 760);
    expect(handle).toHaveAttribute('aria-valuenow', '660');
    firePointer(handle, 'pointerup', 760);
    expect(article).not.toHaveAttribute('data-dragging');
    expect(handle).toHaveAttribute('aria-valuenow', '660');
  });

  it('clamps drag commits to [minWidth, min(maxWidth, container)]', () => {
    const { container } = render(<Brief data={doc} {...resizableProps} />);
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    mockRects(article, { left: 100, width: 560, container: 800 });
    const handle = screen.getByRole('separator');
    firePointer(handle, 'pointerdown', 660);
    firePointer(handle, 'pointermove', 2000);
    expect(handle).toHaveAttribute('aria-valuenow', '800');
    firePointer(handle, 'pointermove', 150);
    expect(handle).toHaveAttribute('aria-valuenow', '400');
  });

  it('controlled: `width` pins the value; commits only report via onWidthChange', () => {
    const onWidthChange = vi.fn();
    const { container } = render(
      <Brief
        data={doc}
        resizable
        width={500}
        minWidth={400}
        maxWidth={900}
        onWidthChange={onWidthChange}
      />,
    );
    const handle = screen.getByRole('separator');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onWidthChange).toHaveBeenCalledWith(516);
    expect(handle).toHaveAttribute('aria-valuenow', '500');
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    expect(article.style.getPropertyValue('--tcl-brief-width')).toBe('500px');
  });

  it('buckets data-size from the measured width (absent before any measure)', () => {
    const { container } = render(<Brief data={doc} />);
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    expect(article).not.toHaveAttribute('data-size');
    fireResize(400, 600);
    expect(article).toHaveAttribute('data-size', 'narrow');
    fireResize(700, 600);
    expect(article).toHaveAttribute('data-size', 'regular');
  });

  it('has no axe violations with the handle rendered', async () => {
    const { container } = render(<Brief data={doc} {...resizableProps} />);
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('section disclosure still toggles with resizable on', () => {
    render(<Brief data={doc} {...resizableProps} />);
    const toggle = screen.getByRole('button', { name: 'Commands' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  // ── review regressions ──────────────────────────────────────────────────

  it('steps from the rendered border-box width, not the content-box measurement', () => {
    // No defaultWidth: the first keypress must grow from the RENDERED 760, not
    // the ResizeObserver's content box (760 − handle lane), which would shrink.
    const onWidthChange = vi.fn();
    const { container } = render(
      <Brief data={doc} resizable minWidth={400} maxWidth={900} onWidthChange={onWidthChange} />,
    );
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    mockRects(article, { left: 100, width: 760, container: 1000 });
    fireResize(732, 600); // content box = border box minus the 28px lane
    const handle = screen.getByRole('separator');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onWidthChange).toHaveBeenLastCalledWith(776);
    expect(handle).toHaveAttribute('aria-valuenow', '776');
  });

  it('preserves the grab offset — no snap when the grip is grabbed mid-lane', () => {
    const { container } = render(<Brief data={doc} {...resizableProps} />);
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    mockRects(article, { left: 100, width: 560, container: 1000 });
    const handle = screen.getByRole('separator');
    // Right edge sits at 660; grab 12px inboard and move 1px.
    firePointer(handle, 'pointerdown', 648);
    firePointer(handle, 'pointermove', 649);
    expect(handle).toHaveAttribute('aria-valuenow', '561');
  });

  it('rtl: dragging toward the start edge grows the pane', () => {
    const { container } = render(<Brief data={doc} {...resizableProps} />);
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    mockRects(article, { left: 100, width: 560, container: 1000 });
    mockRtl(article);
    const handle = screen.getByRole('separator');
    firePointer(handle, 'pointerdown', 105); // handle mirrors to the left edge
    firePointer(handle, 'pointermove', 55); // 50px leftward = 50px wider
    expect(handle).toHaveAttribute('aria-valuenow', '610');
  });

  it('rtl: arrow senses flip (ArrowLeft grows)', () => {
    const { container } = render(<Brief data={doc} {...resizableProps} />);
    mockRtl(container.querySelector('.tcl-brief') as HTMLElement);
    const handle = screen.getByRole('separator');
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(handle).toHaveAttribute('aria-valuenow', '576');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle).toHaveAttribute('aria-valuenow', '560');
  });

  it('floors commits at minWidth when the container is narrower than it', () => {
    const onWidthChange = vi.fn();
    const { container } = render(
      <Brief data={doc} {...resizableProps} onWidthChange={onWidthChange} />,
    );
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    mockRects(article, { left: 100, width: 560, container: 300 });
    const handle = screen.getByRole('separator');
    firePointer(handle, 'pointerdown', 660);
    firePointer(handle, 'pointermove', 100);
    expect(onWidthChange).toHaveBeenLastCalledWith(400);
    expect(handle).toHaveAttribute('aria-valuenow', '400');
  });

  it('widens the announced bounds around an out-of-range controlled width', () => {
    render(<Brief data={doc} resizable width={200} minWidth={400} maxWidth={900} />);
    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-valuenow', '200');
    expect(handle).toHaveAttribute('aria-valuemin', '200');
    expect(handle).toHaveAttribute('aria-valuemax', '900');
  });

  it('swaps an inverted minWidth/maxWidth pair', () => {
    render(<Brief data={doc} resizable defaultWidth={560} minWidth={900} maxWidth={400} />);
    const handle = screen.getByRole('separator');
    fireEvent.keyDown(handle, { key: 'Home' });
    expect(handle).toHaveAttribute('aria-valuenow', '400');
    fireEvent.keyDown(handle, { key: 'End' });
    expect(handle).toHaveAttribute('aria-valuenow', '900');
  });

  it('clamps the defaultWidth seed and the reset commit to the bounds', () => {
    const onWidthChange = vi.fn();
    render(
      <Brief
        data={doc}
        resizable
        defaultWidth={5000}
        minWidth={400}
        maxWidth={900}
        onWidthChange={onWidthChange}
      />,
    );
    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-valuenow', '900');
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(handle).toHaveAttribute('aria-valuenow', '884');
    fireEvent.keyDown(handle, { key: 'Enter' });
    expect(handle).toHaveAttribute('aria-valuenow', '900');
    expect(onWidthChange).toHaveBeenLastCalledWith(900);
  });

  it('never collides the article id with a section region id', () => {
    const { container } = render(
      <Brief
        data={{ title: 'X', sections: [{ id: 'doc', heading: 'Docs', items: ['hi'] }] }}
        resizable
      />,
    );
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    expect(article.id).toBeTruthy();
    const ids = Array.from(container.querySelectorAll('[id]')).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('arrows step from the visible width after an overshooting End (no dead zone)', () => {
    const onWidthChange = vi.fn();
    const { container } = render(
      <Brief
        data={doc}
        resizable
        defaultWidth={560}
        minWidth={400}
        maxWidth={1200}
        onWidthChange={onWidthChange}
      />,
    );
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    // A grid-column-like case: the parent rect over-reports the containing block.
    mockRects(article, { left: 100, width: 600, container: 1200 });
    const handle = screen.getByRole('separator');
    fireEvent.keyDown(handle, { key: 'End' });
    expect(onWidthChange).toHaveBeenLastCalledWith(1200);
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(onWidthChange).toHaveBeenLastCalledWith(584);
  });

  it('ignores a second pointer while a drag is active (anchor is not re-cached)', () => {
    const { container } = render(<Brief data={doc} {...resizableProps} />);
    const article = container.querySelector('.tcl-brief') as HTMLElement;
    mockRects(article, { left: 100, width: 560, container: 1000 });
    const handle = screen.getByRole('separator');
    firePointer(handle, 'pointerdown', 660, 1);
    firePointer(handle, 'pointerdown', 700, 2); // must not re-anchor
    firePointer(handle, 'pointermove', 760, 2);
    expect(handle).toHaveAttribute('aria-valuenow', '660');
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

  it('accepts the session kind and success severity without issues', () => {
    const r = parseBrief({
      view: 'brief',
      kind: 'session',
      sections: [
        { heading: 'C', kind: 'checklist', items: [{ text: 'met', severity: 'success' }] },
      ],
    });
    expect(r.issues).toEqual([]);
    expect((r.data.sections[0].items?.[0] as { severity?: string }).severity).toBe('success');
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
