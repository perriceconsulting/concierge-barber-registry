import { useEffect, useRef } from 'react';

interface Options {
  /**
   * Suppress repeated fires within this window (ms). Prevents double-fires
   * from `visibilitychange` + `focus` events that often arrive within ms of
   * each other. Defaults to 5 seconds.
   */
  throttleMs?: number;
  /**
   * When false, the listeners are not attached. Useful for pausing the
   * refetch behavior during initial load or in test environments.
   */
  enabled?: boolean;
}

/**
 * Run `onVisible` whenever the tab/window regains focus.
 *
 * Use to keep page state in sync with the server after the user switches
 * back from another tab — e.g., admin grants Founding Member to a barber
 * in tab A, barber's open dashboard in tab B refetches and shows the new
 * badge without a manual refresh.
 *
 * Listens to both `visibilitychange` (covers Chrome's tab switching) and
 * `focus` (covers cross-window OS focus). Built-in throttle prevents
 * double-fires.
 *
 * @example
 * useVisibilityRefetch(() => fetchBarbers());
 */
export function useVisibilityRefetch(
  onVisible: () => void,
  options: Options = {},
): void {
  const { throttleMs = 5000, enabled = true } = options;
  // Stable callback ref — avoids re-attaching listeners every render
  const callbackRef = useRef(onVisible);
  callbackRef.current = onVisible;

  useEffect(() => {
    if (!enabled) return;

    let lastFiredAt = Date.now();

    function maybeFire() {
      const now = Date.now();
      if (now - lastFiredAt < throttleMs) return;
      lastFiredAt = now;
      callbackRef.current();
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        maybeFire();
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', maybeFire);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', maybeFire);
    };
  }, [throttleMs, enabled]);
}
