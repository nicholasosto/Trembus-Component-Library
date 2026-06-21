import { Children, cloneElement, isValidElement } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { composeRefs } from './refs';

type AnyProps = Record<string, unknown>;

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...childProps };
  for (const key in slotProps) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    const isHandler = /^on[A-Z]/.test(key);
    if (isHandler && typeof slotValue === 'function') {
      // Compose: run the child's handler first, then the slot's.
      merged[key] =
        typeof childValue === 'function'
          ? (...args: unknown[]) => {
              (childValue as (...a: unknown[]) => unknown)(...args);
              (slotValue as (...a: unknown[]) => unknown)(...args);
            }
          : slotValue;
    } else if (key === 'style') {
      merged[key] = { ...(childValue as CSSProperties), ...(slotValue as CSSProperties) };
    } else if (key === 'className') {
      merged[key] = [childValue, slotValue].filter(Boolean).join(' ');
    } else {
      merged[key] = slotValue;
    }
  }
  return merged;
}

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}

/**
 * Lends its props/behavior to its single child element instead of rendering a
 * wrapper node (the `asChild` pattern). Event handlers compose, className and
 * style merge, refs combine.
 */
export function Slot({ children, ref, ...slotProps }: SlotProps): ReactElement | null {
  if (!isValidElement(children)) {
    if (Children.count(children) > 1) {
      throw new Error('Slot (asChild) expects exactly one React element child.');
    }
    return null;
  }

  const child = children as ReactElement<AnyProps>;
  const childProps = child.props as AnyProps;
  const merged = mergeProps(slotProps as AnyProps, childProps);

  const childRef = childProps.ref as Ref<unknown> | undefined;
  if (ref || childRef) {
    merged.ref = composeRefs(ref as Ref<unknown>, childRef);
  }

  return cloneElement(child, merged);
}
