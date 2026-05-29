import { useEffect } from 'react';

/**
 * Suppress WC v2 universal-provider's "bring wallet to foreground" redirect
 * for Safe-via-WC: after each wallet request the provider calls
 * `window.open(peerMeta.redirect.universal)`, which Safe sets to
 * `https://app.safe.global` — opening an unwanted second tab. The actual
 * prompt still appears inside the user's existing Safe tab, so the redirect
 * adds nothing and breaks focus.
 *
 * Implementation notes:
 * - Uses `startsWith` (not `includes`) so we don't accidentally suppress
 *   benign URLs that happen to contain "app.safe.global" elsewhere (e.g. a
 *   query string).
 * - Cleanup only restores `window.open` if no other code wrapped a patch
 *   on top of ours in the interim. Otherwise we'd silently un-wrap that
 *   other library's patch, leaving them with our captured `originalOpen`
 *   instead of theirs. This is safe under React strict-mode's double-invoke
 *   (both invocations capture the same `original`) and under sibling
 *   useEffects that also wrap `window.open`.
 */
export const useSuppressSafeWcRedirect = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const original = window.open;
    const patched: typeof window.open = (url, ...rest) => {
      if (typeof url === 'string' && url.startsWith('https://app.safe.global')) {
        return null;
      }
      return original.call(window, url, ...rest);
    };
    window.open = patched;

    return () => {
      if (window.open === patched) {
        window.open = original;
      }
    };
  }, []);
};
