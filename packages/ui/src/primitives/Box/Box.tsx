import type { CSSProperties, ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropsWithRef } from '../../types/polymorphic';
import type {
  MaterialTone,
  RadiusToken,
  SpaceToken,
  SurfaceTone,
  ZToken,
} from '../../tokens/tokens.types';
import { cx } from '../../utils/cx';
import './Box.css';

/**
 * `Box` — the Surface primitive (and carrier of Marks). A bounded region with
 * padding, an optional surface treatment, radius, border, and z-layer. Spacing
 * is expressed only in token steps, never raw px, so the "bounded region"
 * abstraction stays honest. Polymorphic via `as`.
 */
export interface BoxOwnProps {
  /** Surface elevation intent — `raised` · `sunken` · `overlay`. */
  surface?: SurfaceTone;
  /** Material skin (e.g. frosted `glass`) applied via [data-material]; tune with the --tcl-mat-* knobs. */
  material?: MaterialTone;
  /** Corner radius token. */
  radius?: RadiusToken;
  /** Draw a border — `true`, `soft`, or `strong`. */
  border?: boolean | 'soft' | 'strong';
  /** Layer from the z-index token scale. */
  z?: ZToken;
  /** Padding step, all sides (space scale — steps, never pixels). */
  p?: SpaceToken;
  /** Horizontal padding step. */
  px?: SpaceToken;
  /** Vertical padding step. */
  py?: SpaceToken;
  /** Top padding step. */
  pt?: SpaceToken;
  /** Right padding step. */
  pr?: SpaceToken;
  /** Bottom padding step. */
  pb?: SpaceToken;
  /** Left padding step. */
  pl?: SpaceToken;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export type BoxProps<C extends ElementType = 'div'> = PolymorphicComponentPropsWithRef<
  C,
  BoxOwnProps
>;

const sp = (v: SpaceToken | undefined): string | undefined =>
  v === undefined ? undefined : `var(--tcl-space-${v})`;

/** Resolves the layout props of a Box into a style object (exported for reuse). */
export function buildBoxStyle(props: BoxOwnProps): CSSProperties {
  const style: CSSProperties = {};
  const { p, px, py, pt, pr, pb, pl, radius, z } = props;
  const top = pt ?? py ?? p;
  const right = pr ?? px ?? p;
  const bottom = pb ?? py ?? p;
  const left = pl ?? px ?? p;
  if ([top, right, bottom, left].some((v) => v !== undefined)) {
    style.padding = `${sp(top) ?? '0'} ${sp(right) ?? '0'} ${sp(bottom) ?? '0'} ${sp(left) ?? '0'}`;
  }
  if (radius) style.borderRadius = `var(--tcl-radius-${radius})`;
  if (z) style.zIndex = `var(--tcl-z-${z})` as unknown as number;
  return style;
}

export function Box<C extends ElementType = 'div'>(props: BoxProps<C>) {
  const {
    as,
    surface = 'none',
    material,
    radius,
    border,
    z,
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
    className,
    style,
    ...rest
  } = props as BoxOwnProps & { as?: ElementType } & Record<string, unknown>;

  const Component = (as ?? 'div') as ElementType;
  const boxStyle = buildBoxStyle({ p, px, py, pt, pr, pb, pl, radius, z });

  const classes = cx(
    'tcl-box',
    surface !== 'none' && `tcl-box--surface-${surface}`,
    border === true && 'tcl-box--border',
    border === 'soft' && 'tcl-box--border-soft',
    border === 'strong' && 'tcl-box--border-strong',
    className,
  );

  return (
    <Component
      className={classes}
      data-material={material}
      style={{ ...boxStyle, ...style }}
      {...rest}
    />
  );
}
