import Head from 'next/head';
import { useRouter } from 'next/router';

/**
 * The organisation behind every olas.network property, as schema.org JSON-LD.
 *
 * One `@id` across the estate: bond, govern, operate and the rest are Olas products,
 * not organisations of their own, so each page points at the same entity olas.network
 * declares rather than inventing a sibling. Only what is true is claimed.
 */
export const OLAS_ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://olas.network/#organization',
  name: 'Olas',
  url: 'https://olas.network',
  logo: 'https://olas.network/images/olas-logo.svg',
  description: 'Olas enables everyone to own and monetize their AI agents.',
  sameAs: [
    'https://x.com/autonolas',
    'https://github.com/valory-xyz',
    'https://www.youtube.com/@autonolas',
  ],
};

/** `<` is escaped so a `</script>` inside a string cannot close the tag early. */
export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, '\\u003c');

export type SeoHeadProps = {
  /** The final document title, already composed by the app. */
  title: string;
  description: string;
  /** The site's origin, no trailing slash, e.g. `https://bond.olas.network`. */
  siteUrl: string;
  /**
   * The page's own absolute URL, when the app knows it. Otherwise it is derived from the
   * current route, so a page that never passes one still canonicalises to itself rather
   * than to the site root — which is what every app served for pages without a `pageUrl`.
   */
  url?: string;
  imageUrl: string;
};

/**
 * The current route's `asPath`, or `/` where no router is mounted. `useRouter` throws
 * outside a Next app, and the prerender specs render pages directly, on purpose, to prove
 * they do not depend on the router — a head tag must not be what breaks that.
 */
const useCurrentPath = (): string => {
  try {
    // Always called, so hook order is stable; only the throw is caught.
    return useRouter().asPath ?? '/';
  } catch {
    return '/';
  }
};

/** The current route as an absolute URL, without query string, hash or trailing slash. */
const selfUrl = (siteUrl: string, asPath: string) => {
  const cleanPath = (asPath || '/').split('?')[0].split('#')[0].replace(/\/$/, '');
  return cleanPath === '' ? `${siteUrl}/` : `${siteUrl}${cleanPath}`;
};

export const SeoHead = ({
  title,
  description,
  siteUrl,
  url: explicitUrl,
  imageUrl,
}: SeoHeadProps) => {
  // Unconditional so hook order is stable; only used when the app gave no URL.
  const currentPath = useCurrentPath();
  const url = explicitUrl ?? selfUrl(siteUrl, currentPath);
  return (
    <Head>
      <title>{title}</title>
      {/* Without a canonical, every URL variant (query strings, trailing slashes) competes
        with the page for the same content. */}
      <link rel="canonical" href={url} key="canonical" />
      <meta name="title" content={title} key="title" />
      <meta name="description" content={description} key="description" />

      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:url" content={url} key="og:url" />
      <meta property="og:title" content={title} key="og:title" />
      <meta property="og:description" content={description} key="og:description" />
      <meta property="og:image" content={imageUrl} key="og:image" />

      <meta property="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta property="twitter:url" content={url} key="twitter:url" />
      <meta property="twitter:title" content={title} key="twitter:title" />
      <meta property="twitter:description" content={description} key="twitter:description" />
      <meta property="twitter:image" content={imageUrl} key="twitter:image" />

      {/* Once per page, from here, so a page cannot get its meta tags without it. */}
      <script
        type="application/ld+json"
        key="ld-organization"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(OLAS_ORGANIZATION) }}
      />
    </Head>
  );
};
