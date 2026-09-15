import Head from 'next/head';

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
  alternateName: 'Autonolas',
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
  /** The page's own absolute URL — becomes the canonical and the share URL. */
  url: string;
  imageUrl: string;
};

/**
 * The head tags every app renders, in one place.
 *
 * Eight apps each carried a copy of this component; half of them had a canonical tag
 * and half did not, and none had structured data. Each app's own `Meta` still composes
 * its title and URL exactly as before — this only renders them — so nothing users see
 * changes. What it adds, uniformly: the canonical, and an Organization block so every
 * property identifies itself as part of Olas to whatever reads schema.org.
 */
export const SeoHead = ({ title, description, url, imageUrl }: SeoHeadProps) => (
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
