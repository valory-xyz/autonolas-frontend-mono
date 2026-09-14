import { useLayoutEffect, useState } from 'react';

/**
 * `false` on the server and the first client render, `true` after. Wrap only what genuinely
 * mismatches (antd's `useBreakpoint` returns `{}` on the server) — never the page content.
 * A layout effect, so the flip lands before the first paint rather than a frame after it.
 */
export const useIsMounted = () => {
  const [isMounted, setIsMounted] = useState(false);

  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
};
