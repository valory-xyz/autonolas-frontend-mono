import { useEffect, useState } from 'react';

/**
 * `false` on the server and the first client render, `true` after. Wrap only what genuinely
 * mismatches (antd's `useBreakpoint` returns `{}` on the server) — never the page content.
 */
export const useIsMounted = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
};
