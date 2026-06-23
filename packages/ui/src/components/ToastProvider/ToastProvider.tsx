import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Portal } from '../../utils/Portal';
import { cx } from '../../utils/cx';
import type { StatusTone } from '../../tokens/tokens.types';
import './ToastProvider.css';

export type ToastTone = 'neutral' | StatusTone;

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Auto-dismiss after ms. 0 keeps it until dismissed. */
  duration?: number;
}

interface ToastRecord extends Required<Pick<ToastOptions, 'title' | 'tone' | 'duration'>> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>.');
  return ctx;
}

let toastCounter = 0;

export interface ToastProviderProps {
  children: ReactNode;
  /** Default auto-dismiss duration (ms). */
  duration?: number;
  placement?: 'top' | 'bottom';
}

export function ToastProvider({ children, duration = 5000, placement = 'bottom' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: ToastOptions) => {
      toastCounter += 1;
      const id = `tcl-toast-${toastCounter}`;
      setToasts((list) => [
        ...list,
        { id, tone: 'neutral', duration, ...opts },
      ]);
      return id;
    },
    [duration],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <Portal>
        <div
          className={cx('tcl-toast-viewport', `tcl-toast-viewport--${placement}`)}
          role="region"
          aria-label="Notifications"
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      </Portal>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: string) => void }) {
  const { id, title, description, tone, duration } = toast;
  const timer = useRef<number | undefined>(undefined);

  const start = useCallback(() => {
    if (!duration) return;
    timer.current = window.setTimeout(() => onDismiss(id), duration);
  }, [duration, id, onDismiss]);
  const stop = useCallback(() => window.clearTimeout(timer.current), []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  const assertive = tone === 'danger' || tone === 'warning';

  return (
    <div
      className={cx('tcl-toast', `tcl-toast--${tone}`)}
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      onPointerEnter={stop}
      onPointerLeave={start}
    >
      <div className="tcl-toast__body">
        <p className="tcl-toast__title">{title}</p>
        {description && <p className="tcl-toast__desc">{description}</p>}
      </div>
      <button type="button" className="tcl-toast__close" aria-label="Dismiss" onClick={() => onDismiss(id)}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
