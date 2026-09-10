import { useEffect, useState } from 'react';

/**
 * `false` during a server render and on the first client render, `true` after that.
 *
 * Use it to defer only the parts of a tree that genuinely cannot agree between the two — antd's
 * `Grid.useBreakpoint` returns `{}` on the server and real values in the browser, so anything
 * branching on it renders differently and React reports a hydration mismatch.
 *
 * It used to wrap the entire app in `_app.tsx`, which meant every page served nothing but its
 * `<title>` — 15 characters — to anything that does not run JavaScript. Keep it around the
 * responsive chrome, never around content.
 */
export const useIsMounted = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
};
