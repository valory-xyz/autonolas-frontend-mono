import { middleware } from 'libs/common-middleware/src';

export default middleware;

// Next 16 / Turbopack requires `config` to be statically defined in the
// middleware file itself; re-exports from another module aren't recognized.
export const config = {
  // robots.txt, sitemap.xml and llms.txt are crawler metadata, not site content:
  // they must stay reachable from every region or crawlers give up on the site.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt).*)'],
};
