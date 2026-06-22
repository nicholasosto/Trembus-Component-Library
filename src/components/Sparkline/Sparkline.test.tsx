import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Sparkline } from './Sparkline';

const series = [2.1, 1.9, 1.5, 1.3, 1.1, 1.0];

describe('Sparkline', () => {
  it('exposes a labeled sparkline to assistive tech as an image', () => {
    render(<Sparkline values={series} label="DIRT lag trend" />);
    expect(screen.getByRole('img', { name: 'DIRT lag trend' })).toBeInTheDocument();
  });

  it('is decorative (aria-hidden) when no label is given', () => {
    const { container } = render(<Sparkline values={series} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('draws a line and an area for a multi-point series', () => {
    const { container } = render(<Sparkline values={series} />);
    expect(container.querySelector('.tcl-sparkline__line')).toBeInTheDocument();
    expect(container.querySelector('.tcl-sparkline__area')).toBeInTheDocument();
    expect(container.querySelector('.tcl-sparkline__dot')).toBeInTheDocument();
  });

  it('omits the area fill when area={false}', () => {
    const { container } = render(<Sparkline values={series} area={false} />);
    expect(container.querySelector('.tcl-sparkline__area')).not.toBeInTheDocument();
    expect(container.querySelector('.tcl-sparkline__line')).toBeInTheDocument();
  });

  it('skips null / non-finite entries without producing NaN coordinates', () => {
    const { container } = render(<Sparkline values={[1, null, 3, NaN, 5, undefined]} />);
    const line = container.querySelector('.tcl-sparkline__line');
    expect(line).toBeInTheDocument();
    expect(line?.getAttribute('points')).not.toMatch(/NaN/);
  });

  it('renders a single point as a dot with no line', () => {
    const { container } = render(<Sparkline values={[42]} />);
    expect(container.querySelector('.tcl-sparkline__dot')).toBeInTheDocument();
    expect(container.querySelector('.tcl-sparkline__line')).not.toBeInTheDocument();
  });

  it('renders an empty box for an empty / all-gap series without throwing', () => {
    const { container } = render(<Sparkline values={[null, undefined, NaN]} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('.tcl-sparkline__line')).not.toBeInTheDocument();
    expect(container.querySelector('.tcl-sparkline__dot')).not.toBeInTheDocument();
  });

  it('never inverts the y-domain when a single bound is forced past the data', () => {
    // max forced below the data used to make span negative → a flipped chart
    // with coordinates outside the viewBox. The domain must stay upright.
    const { container } = render(<Sparkline values={[20, 30, 40]} max={10} />);
    const pts = (container.querySelector('.tcl-sparkline__line')?.getAttribute('points') ?? '')
      .trim()
      .split(/\s+/)
      .map((pair) => Number(pair.split(',')[1]));
    expect(pts).toHaveLength(3);
    expect(pts.every((y) => Number.isFinite(y))).toBe(true);
    // ascending input → strictly descending y (higher value sits higher up)
    expect(pts[0]).toBeGreaterThan(pts[1]);
    expect(pts[1]).toBeGreaterThan(pts[2]);
  });

  it('has no axe violations (labeled and decorative)', async () => {
    const labeled = render(<Sparkline values={series} label="Trend" />);
    expect(await a11yViolations(labeled.container)).toEqual([]);
    const decorative = render(<Sparkline values={series} />);
    expect(await a11yViolations(decorative.container)).toEqual([]);
  });
});
