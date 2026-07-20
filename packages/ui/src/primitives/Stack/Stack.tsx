import type { CSSProperties, ElementType } from 'react';
import type { PolymorphicComponentPropsWithRef } from '../../types/polymorphic';
import type { SpaceToken } from '../../tokens/tokens.types';
import { Box } from '../Box/Box';
import type { BoxOwnProps, BoxProps } from '../Box/Box';

/**
 * `Stack` / `Inline` — the Relation primitive (order + grouping made visual).
 * Thin flex layers over `Box`: `Stack` stacks vertically, `Inline` flows
 * horizontally. Both inherit every `Box` prop (`as`, surface, padding…).
 */
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

export interface StackOwnProps extends BoxOwnProps {
  /** Space step between children (token scale — steps, never pixels). */
  gap?: SpaceToken;
  /** Cross-axis alignment. */
  align?: Align;
  /** Main-axis distribution. */
  justify?: Justify;
  /** Allow children to wrap onto new lines/rows. */
  wrap?: boolean;
}

export type StackProps<C extends ElementType = 'div'> = PolymorphicComponentPropsWithRef<
  C,
  StackOwnProps
>;

const ALIGN: Record<Align, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const JUSTIFY: Record<Justify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

function renderFlex(direction: 'row' | 'column', props: StackOwnProps & Record<string, unknown>) {
  const { gap, align, justify, wrap, style, ...rest } = props;
  const flexStyle: CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    ...(gap !== undefined ? { gap: `var(--tcl-space-${gap})` } : {}),
    ...(align ? { alignItems: ALIGN[align] } : {}),
    ...(justify ? { justifyContent: JUSTIFY[justify] } : {}),
    ...(wrap ? { flexWrap: 'wrap' as const } : {}),
  };
  return <Box {...(rest as BoxProps<'div'>)} style={{ ...flexStyle, ...(style as CSSProperties) }} />;
}

export function Stack<C extends ElementType = 'div'>(props: StackProps<C>) {
  return renderFlex('column', props as StackOwnProps & Record<string, unknown>);
}

export function Inline<C extends ElementType = 'div'>(props: StackProps<C>) {
  return renderFlex('row', props as StackOwnProps & Record<string, unknown>);
}
