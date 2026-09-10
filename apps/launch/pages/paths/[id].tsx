import { GetStaticPaths, GetStaticProps } from 'next';

import { readPublicFile } from 'libs/util-ssr/src';

import { Meta } from 'components/Meta';
import { PathDetailPage } from 'components/PathDetail';

import { PATHS, Path } from 'common-util/constants/paths';

type PathDetailProps = {
  path: Path;
  markdown: string;
};

/**
 * The two paths are a checked-in constant, so an unknown id is a 404 rather than a page to
 * generate. It used to answer 200 with an empty shell — a soft 404, which tells a crawler the
 * page exists and has nothing on it.
 */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: PATHS.map(({ id }) => ({ params: { id } })),
  fallback: false,
});

/**
 * The guide lives in `public/paths-markdown/<id>.md` and used to be fetched from the browser, so
 * the served HTML carried 105 characters of nav and none of the content — the same shell for both
 * paths and for any typo.
 */
export const getStaticProps: GetStaticProps<PathDetailProps> = async ({ params }) => {
  const id = String(params?.id);
  const path = PATHS.find((candidate) => candidate.id === id);
  if (!path) return { notFound: true };

  const markdown = await readPublicFile('launch', `paths-markdown/${id}.md`);
  return { props: { path, markdown } };
};

const PathDetail = ({ path, markdown }: PathDetailProps) => (
  <>
    <Meta pageTitle={path.name} description={path.description} pageUrl={`paths/${path.id}`} />
    <PathDetailPage path={path} markdown={markdown} />
  </>
);

export default PathDetail;
