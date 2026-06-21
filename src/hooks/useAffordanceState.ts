import { useCallback, useState } from 'react';
import type {
  FocusEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  PointerEventHandler,
  SyntheticEvent,
} from 'react';

/**
 * The Affordance state machine — the SINGLE source of interaction state for the
 * whole library (the vault primitive: an input-accepting region with an
 * idle → hover → pressed → focus → disabled machine). Every interactive
 * component consumes this so feedback (Job #3, Acknowledge Input) is structural,
 * not re-implemented per component. CSS targets the emitted `[data-state]`.
 */
export type AffordanceState = 'idle' | 'hover' | 'pressed' | 'focus-visible' | 'disabled';

export interface UseAffordanceStateOptions {
  disabled?: boolean;
  loading?: boolean;
  /** Activation callback — fires on click and native keyboard activation. */
  onPress?: (event: SyntheticEvent) => void;
}

export interface AffordanceHandlers {
  onPointerEnter: PointerEventHandler;
  onPointerLeave: PointerEventHandler;
  onPointerDown: PointerEventHandler;
  onPointerUp: PointerEventHandler;
  onKeyDown: KeyboardEventHandler;
  onKeyUp: KeyboardEventHandler;
  onFocus: FocusEventHandler;
  onBlur: FocusEventHandler;
  onClick: MouseEventHandler;
}

export interface AffordanceDataAttrs {
  'data-state': AffordanceState;
  'aria-disabled'?: true;
  'aria-busy'?: true;
}

export interface UseAffordanceStateReturn {
  state: AffordanceState;
  handlers: AffordanceHandlers;
  dataAttrs: AffordanceDataAttrs;
}

const ACTIVATION_KEYS = new Set([' ', 'Enter', 'Spacebar']);

export function useAffordanceState(
  options: UseAffordanceStateOptions = {},
): UseAffordanceStateReturn {
  const { disabled = false, loading = false, onPress } = options;
  const inactive = disabled || loading;

  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);

  const state: AffordanceState = inactive
    ? 'disabled'
    : pressed
      ? 'pressed'
      : focusVisible
        ? 'focus-visible'
        : hover
          ? 'hover'
          : 'idle';

  const onPointerEnter = useCallback<PointerEventHandler>(() => setHover(true), []);
  const onPointerLeave = useCallback<PointerEventHandler>(() => {
    setHover(false);
    setPressed(false);
  }, []);
  const onPointerDown = useCallback<PointerEventHandler>(
    (e) => {
      if (inactive) return;
      // Only primary pointer.
      if ('button' in e && e.button !== 0) return;
      setPressed(true);
    },
    [inactive],
  );
  const onPointerUp = useCallback<PointerEventHandler>(() => setPressed(false), []);

  const onKeyDown = useCallback<KeyboardEventHandler>(
    (e) => {
      if (inactive) return;
      if (ACTIVATION_KEYS.has(e.key)) setPressed(true);
    },
    [inactive],
  );
  const onKeyUp = useCallback<KeyboardEventHandler>((e) => {
    if (ACTIVATION_KEYS.has(e.key)) setPressed(false);
  }, []);

  const onFocus = useCallback<FocusEventHandler>((e) => {
    // Mirror :focus-visible — only show the ring for keyboard/programmatic focus.
    if (e.target.matches?.(':focus-visible')) setFocusVisible(true);
  }, []);
  const onBlur = useCallback<FocusEventHandler>(() => {
    setFocusVisible(false);
    setPressed(false);
  }, []);

  const onClick = useCallback<MouseEventHandler>(
    (e) => {
      if (inactive) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Native <button>/<a> already translate Enter/Space into a click, so a
      // single onClick covers pointer + keyboard activation without double-firing.
      onPress?.(e);
    },
    [inactive, onPress],
  );

  const dataAttrs: AffordanceDataAttrs = { 'data-state': state };
  if (inactive) dataAttrs['aria-disabled'] = true;
  if (loading) dataAttrs['aria-busy'] = true;

  return {
    state,
    handlers: {
      onPointerEnter,
      onPointerLeave,
      onPointerDown,
      onPointerUp,
      onKeyDown,
      onKeyUp,
      onFocus,
      onBlur,
      onClick,
    },
    dataAttrs,
  };
}
