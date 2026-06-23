import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '@trembus/tokens/testing';
import { Effigy } from './Effigy';
import type { EffigyContract } from './Effigy';

// The model-viewer runtime (three.js + WebGL) can't run in jsdom and the
// component lazy-imports it, so stub the module to keep the unit env hermetic and
// fast. The <model-viewer> tag still renders as an inert custom element, and its
// light-DOM children (poster, AR button) stay queryable.
vi.mock('@google/model-viewer', () => ({}));

const relic: EffigyContract = {
  src: 'https://example.com/relic.glb',
  alt: 'A carved reliquary effigy',
  poster: 'https://example.com/relic.webp',
  index: 'RELIC · 001',
  caption: 'The Kept Cosmonaut',
};

/** The model-viewer element rendered inside the stage. */
function viewer(container: HTMLElement): HTMLElement {
  const el = container.querySelector('model-viewer');
  if (el == null) throw new Error('no <model-viewer> rendered');
  return el as HTMLElement;
}

describe('Effigy', () => {
  it('frames the model with its src + accessible name, plus index and caption text', () => {
    const { container } = render(<Effigy data={relic} />);
    const el = viewer(container);
    expect(el).toHaveAttribute('src', relic.src);
    expect(el).toHaveAttribute('alt', relic.alt); // WCAG 1.1.1 — the non-text alternative
    expect(el).toHaveAttribute('camera-controls'); // interactive orbit by default
    expect(screen.getByText('RELIC · 001')).toBeInTheDocument();
    expect(screen.getByText('The Kept Cosmonaut')).toBeInTheDocument();
  });

  it('defers the download behind a focusable "Load 3D" button when a poster is set (reveal=interaction → manual)', () => {
    const { container } = render(<Effigy data={relic} />);
    expect(viewer(container)).toHaveAttribute('reveal', 'manual');
    const load = screen.getByRole('button', { name: 'Load 3D model: A carved reliquary effigy' });
    // the poster image rides inside the button, decoratively (name lives on the button)
    const img = load.querySelector('.tcl-effigy__poster-img');
    expect(img).toHaveAttribute('src', relic.poster);
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('clicking "Load 3D" dismisses the poster (loads the model) and retires the button', async () => {
    const user = userEvent.setup();
    const { container } = render(<Effigy data={relic} />);
    const dismissPoster = vi.fn();
    Object.assign(viewer(container), { dismissPoster }); // stand in for the upgraded element API
    await user.click(screen.getByRole('button', { name: /Load 3D model/ }));
    expect(dismissPoster).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /Load 3D model/ })).toBeNull();
  });

  it('reveals automatically (no load button) when reveal is auto, with a decorative poster', () => {
    const { container } = render(<Effigy data={{ ...relic, reveal: 'auto' }} />);
    const el = viewer(container);
    expect(el).toHaveAttribute('reveal', 'auto');
    expect(screen.queryByRole('button', { name: /Load 3D model/ })).toBeNull();
    const plate = container.querySelector('.tcl-effigy__poster[aria-hidden="true"]');
    expect(plate).not.toBeNull();
    expect(plate?.querySelector('.tcl-effigy__poster-img')).toHaveAttribute('alt', '');
  });

  it('falls back to a decorative placeholder plate when no poster is given (auto reveal)', () => {
    const { container } = render(<Effigy data={{ ...relic, poster: undefined }} />);
    const el = viewer(container);
    expect(el).toHaveAttribute('reveal', 'auto'); // interaction is meaningless without a poster
    expect(container.querySelector('.tcl-effigy__poster-img')).toBeNull();
    expect(container.querySelector('.tcl-effigy__poster-glyph')).not.toBeNull();
  });

  it('drops camera-controls when disabled', () => {
    const { container } = render(<Effigy data={{ ...relic, cameraControls: false }} />);
    expect(viewer(container)).not.toHaveAttribute('camera-controls');
  });

  it('has no rotate control and no auto-rotate by default', () => {
    const { container } = render(<Effigy data={{ ...relic, reveal: 'auto' }} />);
    expect(screen.queryByRole('button', { name: /rotation/i })).toBeNull();
    expect(viewer(container)).not.toHaveAttribute('auto-rotate');
  });

  it('exposes a focusable pause control when autoRotate is on, toggling aria-pressed + the attribute', async () => {
    const user = userEvent.setup();
    // reveal:auto so the model is shown (not behind the load button) and the control is live
    const { container } = render(<Effigy data={{ ...relic, reveal: 'auto', autoRotate: true }} />);
    expect(viewer(container)).toHaveAttribute('auto-rotate'); // starts rotating
    const pause = screen.getByRole('button', {
      name: /Pause rotation of A carved reliquary effigy/,
    });
    expect(pause).toHaveAttribute('aria-pressed', 'true');

    await user.click(pause);
    // paused → the attribute is gone and the control now offers to resume
    expect(viewer(container)).not.toHaveAttribute('auto-rotate');
    expect(screen.getByRole('button', { name: /Resume rotation/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('renders the AR affordance as a real button only when ar is set', () => {
    const { rerender } = render(<Effigy data={{ ...relic, reveal: 'auto' }} />);
    expect(screen.queryByRole('button', { name: /View in your space/ })).toBeNull();
    rerender(<Effigy data={{ ...relic, reveal: 'auto', ar: true }} />);
    expect(screen.getByRole('button', { name: /View in your space/ })).toBeInTheDocument();
  });

  it('announces load through the aria-live region', () => {
    const { container } = render(<Effigy data={relic} />);
    const live = container.querySelector('.tcl-effigy__live')!;
    expect(live.textContent).toBe(''); // idle — silent
    fireEvent(viewer(container), new Event('load'));
    expect(live).toHaveTextContent(/model loaded/);
  });

  it('ignores a load/error event that did not originate on the model-viewer element', () => {
    const { container } = render(<Effigy data={relic} />);
    const live = container.querySelector('.tcl-effigy__live')!;
    // a bubbled child resource error must NOT be read as a model fault
    const stray = new Event('error', { bubbles: true });
    container.querySelector('.tcl-effigy__poster-img')?.dispatchEvent(stray);
    expect(container.querySelector('.tcl-effigy__fault')).toBeNull();
    expect(live.textContent).toBe('');
  });

  it('surfaces a load fault both visually and via aria-live on error', () => {
    const { container } = render(<Effigy data={relic} />);
    fireEvent(viewer(container), new Event('error'));
    expect(container.querySelector('.tcl-effigy__fault')).not.toBeNull();
    expect(container.querySelector('.tcl-effigy__live')).toHaveTextContent(/could not load/);
  });

  it('has no axe violations (default — load affordance)', async () => {
    const { container } = render(<Effigy data={relic} />);
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('has no axe violations with AR + auto-rotate (auto reveal)', async () => {
    const { container } = render(
      <Effigy data={{ ...relic, reveal: 'auto', ar: true, autoRotate: true }} />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('has no axe violations in the load-fault state', async () => {
    const { container } = render(<Effigy data={relic} />);
    fireEvent(viewer(container), new Event('error'));
    expect(await a11yViolations(container)).toEqual([]);
  });
});
