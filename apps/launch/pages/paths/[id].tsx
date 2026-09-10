import { GetStaticPaths, GetStaticProps } from 'next';

import { readPublicFile } from 'libs/util-ssr/src';

import { Meta } from 'components/Meta';
import { PathDetailPage } from 'components/PathDetail';

import { PATHS, Path } from 'common-util/constants/paths';

type PathDetailProps = {
  path: Path;
  markdown: string;
};

/** The paths are a checked-in constant, so an unknown id is a real 404, not a 200 with a shell. */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: PATHS.map(({ id }) => ({ params: { id } })),
  fallback: false,
});

/** The guide used to be fetched in the browser, so the served HTML carried none of it. */
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
