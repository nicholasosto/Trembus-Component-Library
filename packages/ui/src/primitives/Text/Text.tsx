import type { CSSProperties, ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropsWithRef } from '../../types/polymorphic';
import type { FontWeightToken, TextTone, TypeToken } from '../../tokens/tokens.types';
import { cx } from '../../utils/cx';
import './Text.css';

/**
 * `Text` — the Mark primitive. It draws glyphs; *meaning* comes from `as`
 * (`h1` means heading, `label` means label). So the "what's drawn vs what it
 * means" split is literally `size`/`weight`/`tone` (drawn) vs `as` (meaning).
 */
const WEIGHT: Record<FontWeightToken, string> = {
  regular: 'var(--tcl-weight-regular)',
  medium: 'var(--tcl-weight-medium)',
  semibold: 'var(--tcl-weight-semibold)',
  bold: 'var(--tcl-weight-bold)',
};

function toneColor(tone: TextTone): string {
  switch (tone) {
    case 'default':
      return 'var(--tcl-text)';
    case 'dim':
      return 'var(--tcl-text-dim)';
    case 'faint':
      return 'var(--tcl-text-faint)';
    case 'accent':
      return 'var(--tcl-accent)';
    default:
      return `var(--tcl-status-${tone})`;
  }
}

export interface TextOwnProps {
  /** Type-scale step (`xs`–`xl`). */
  size?: TypeToken;
  /** Font-weight token. */
  weight?: FontWeightToken;
  /** Ink color from the text-tone vocabulary (status tones included). Default `default`. */
  tone?: TextTone;
  /** Use the mono stack. */
  mono?: boolean;
  /** Clamp to a single line with an ellipsis. */
  truncate?: boolean;
  /** Text alignment. */
  align?: 'start' | 'center' | 'end';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export type TextProps<C extends ElementType = 'span'> = PolymorphicComponentPropsWithRef<
  C,
  TextOwnProps
>;

export function Text<C extends ElementType = 'span'>(props: TextProps<C>) {
  const {
    as,
    size,
    weight,
    tone = 'default',
    mono,
    truncate,
    align,
    className,
    style,
    ...rest
  } = props as TextOwnProps & { as?: ElementType } & Record<string, unknown>;

  const Component = (as ?? 'span') as ElementType;
  const textStyle: CSSProperties = {
    color: toneColor(tone),
    ...(size ? { fontSize: `var(--tcl-text-${size})` } : {}),
    ...(weight ? { fontWeight: WEIGHT[weight] as unknown as number } : {}),
    ...(align ? { textAlign: align } : {}),
  };

  const classes = cx(
    'tcl-text',
    mono && 'tcl-text--mono',
    truncate && 'tcl-text--truncate',
    className,
  );

  return <Component className={classes} style={{ ...textStyle, ...style }} {...rest} />;
}
