// Styles must load first so the @layer order is established before any
// component CSS. Consumers using the prebuilt bundle import '@trembus/ui/styles.css'.
import './styles/index.css';

// ── tokens ──
export { tokens } from './tokens/tokens';
export type { Tokens } from './tokens/tokens';
export type * from './tokens/tokens.types';

// ── types ──
export type * from './types/polymorphic';
export type { ComponentContract, JobSatisfaction, UIJob } from './types/contract';

// ── utils ──
export { cx } from './utils/cx';
export type { ClassValue } from './utils/cx';
export { Slot } from './utils/Slot';
export type { SlotProps } from './utils/Slot';
export { Portal } from './utils/Portal';
export type { PortalProps } from './utils/Portal';
export { composeRefs, useComposedRefs, setRef } from './utils/refs';

// ── hooks ──
export { useAffordanceState } from './hooks/useAffordanceState';
export type {
  AffordanceState,
  AffordanceHandlers,
  AffordanceDataAttrs,
  UseAffordanceStateOptions,
  UseAffordanceStateReturn,
} from './hooks/useAffordanceState';
export { useReducedMotion } from './hooks/useReducedMotion';
export { useReturnFocus } from './hooks/useReturnFocus';
export { useFocusTrap } from './hooks/useFocusTrap';
export { useDismissable } from './hooks/useDismissable';
export type { UseDismissableOptions } from './hooks/useDismissable';

// ── primitives ──
export { Box, buildBoxStyle } from './primitives/Box/Box';
export type { BoxProps, BoxOwnProps } from './primitives/Box/Box';
export { Stack, Inline } from './primitives/Stack/Stack';
export type { StackProps, StackOwnProps } from './primitives/Stack/Stack';
export { Text } from './primitives/Text/Text';
export type { TextProps, TextOwnProps } from './primitives/Text/Text';
export { Pressable } from './primitives/Pressable/Pressable';
export type { PressableProps, PressableOwnProps } from './primitives/Pressable/Pressable';

// ── components ──
export { Button } from './components/Button/Button';
export type { ButtonProps } from './components/Button/Button';
export { Badge } from './components/Badge/Badge';
export type { BadgeProps } from './components/Badge/Badge';
export { Input } from './components/Input/Input';
export type { InputProps } from './components/Input/Input';
export { Dialog } from './components/Dialog/Dialog';
export type { DialogProps } from './components/Dialog/Dialog';
