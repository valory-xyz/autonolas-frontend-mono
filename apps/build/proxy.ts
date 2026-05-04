import { middleware } from 'libs/common-middleware/src';

export default middleware;

// Next 16 / Turbopack requires `config` to be statically defined in the
// middleware file itself; re-exports from another module aren't recognized.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
