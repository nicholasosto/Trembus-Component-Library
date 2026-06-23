import type { CSSProperties, ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropsWithRef } from '../../types/polymorphic';
import { useAffordanceState } from '../../hooks/useAffordanceState';
import type { UseAffordanceStateOptions } from '../../hooks/useAffordanceState';
import { Slot } from '../../utils/Slot';
import { cx } from '../../utils/cx';
import { isDev } from '../../utils/env';
import './Pressable.css';

/**
 * `Pressable` — the Affordance primitive. The one interactive element every
 * clickable component composes from. It owns the Affordance state machine
 * (via `useAffordanceState`), guarantees a focus ring + `data-state` feedback
 * (Job #3), and defaults to a real `<button>` so capability is never invisible
 * (Job #2). Use `asChild` to lend its behavior to an existing interactive
 * element with no extra DOM.
 */
export interface PressableOwnProps extends UseAffordanceStateOptions {
  asChild?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export type PressableProps<C extends ElementType = 'button'> = PolymorphicComponentPropsWithRef<
  C,
  PressableOwnProps
>;

export function Pressable<C extends ElementType = 'button'>(props: PressableProps<C>) {
  const { as, asChild, disabled, loading, onPress, className, ...rest } = props as PressableOwnProps & {
    as?: ElementType;
  } & Record<string, unknown>;

  const { handlers, dataAttrs } = useAffordanceState({ disabled, loading, onPress });

  const Component: ElementType = asChild ? Slot : ((as ?? 'button') as ElementType);
  const classes = cx('tcl-pressable', className);

  const elementProps: Record<string, unknown> = {
    className: classes,
    ...handlers,
    ...dataAttrs,
    ...rest,
  };

  if (!asChild && Component === 'button') {
    elementProps.type = (rest.type as string | undefined) ?? 'button';
    elementProps.disabled = Boolean(disabled || loading);
    // The native `disabled` attribute supersedes aria-disabled.
    delete elementProps['aria-disabled'];
  }

  if (isDev && !asChild) {
    const tag = typeof Component === 'string' ? Component : '';
    if (tag && tag !== 'button' && tag !== 'a') {
      console.warn(
        `[Pressable] Rendering as <${tag}> risks an invisible or unreachable affordance. ` +
          'Prefer <button>, <a href>, or asChild with a real interactive element.',
      );
    }
  }

  return <Component {...elementProps} />;
}
