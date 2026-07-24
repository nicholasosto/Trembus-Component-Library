import { useCallback, useEffect, useRef, useState } from 'react';

/** ResizeObserver-backed content-box size of an element (SSR-safe, browser-frame-throttled). */
export function useElementSize(): readonly [
  (node: HTMLElement | null) => void,
  { width: number; height: number },
] {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const roRef = useRef<ResizeObserver | null>(null);

  const apply = useCallback((width: number, height: number) => {
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      roRef.current?.disconnect();
      roRef.current = null;
      if (!node) return;
      // Seed synchronously from clientWidth/Height (the PADDING box, sans border +
      // scrollbar). The ResizeObserver then reports the CONTENT box — identical for
      // padding-less elements (VirtualAssetGrid's scroller); a padded element gets
      // one corrective tick on the first observation.
      apply(node.clientWidth, node.clientHeight);
      if (typeof ResizeObserver === 'undefined') return;
      // ResizeObserver is already coalesced to ≤ once per frame by the browser.
      const ro = new ResizeObserver((entries) => {
        const e = entries[entries.length - 1];
        if (e) apply(e.contentRect.width, e.contentRect.height);
      });
      ro.observe(node);
      roRef.current = ro;
    },
    [apply],
  );

  useEffect(() => () => roRef.current?.disconnect(), []);
  return [setRef, size] as const;
}
