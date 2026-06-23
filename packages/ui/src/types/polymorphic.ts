import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementType,
  PropsWithChildren,
} from 'react';

/**
 * Polymorphic component typing — lets a primitive change its rendered element
 * via an `as` prop while staying fully type-safe (props follow the element).
 */
type AsProp<C extends ElementType> = { as?: C };

type PropsToOmit<C extends ElementType, P> = keyof (AsProp<C> & P);

export type PolymorphicComponentProps<C extends ElementType, Props = object> = PropsWithChildren<
  Props & AsProp<C>
> &
  Omit<ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

export type PolymorphicRef<C extends ElementType> = ComponentPropsWithRef<C>['ref'];

export type PolymorphicComponentPropsWithRef<
  C extends ElementType,
  Props = object,
> = PolymorphicComponentProps<C, Props> & { ref?: PolymorphicRef<C> };
