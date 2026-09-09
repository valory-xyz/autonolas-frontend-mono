import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { GetStaticPaths, GetStaticProps } from 'next';

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
 * The guide itself lives in `public/paths-markdown/<id>.md` and used to be fetched from the
 * browser, so the served HTML carried 105 characters of nav and none of the content — the same
 * shell for both paths and for any typo. Reading it here puts it in the HTML instead.
 *
 * Next resolves `process.cwd()` to the app directory, but an Nx build can run from the
 * workspace root, so both are tried rather than assuming one.
 */
const MARKDOWN_DIRS = [
  join(process.cwd(), 'public', 'paths-markdown'),
  join(process.cwd(), 'apps', 'launch', 'public', 'paths-markdown'),
];

const readGuide = async (id: string) => {
  const failures: string[] = [];
  for (const dir of MARKDOWN_DIRS) {
    try {
      return await readFile(join(dir, `${id}.md`), 'utf8');
    } catch (error) {
      failures.push(`${dir}: ${(error as Error).message}`);
    }
  }
  // Throwing fails the build. That is the point: shipping the page without its guide is the
  // bug this fixes, and it would be invisible in the browser, which fetches the file anyway.
  throw new Error(`Could not read the guide for "${id}".\n${failures.join('\n')}`);
};

export const getStaticProps: GetStaticProps<PathDetailProps> = async ({ params }) => {
  const id = String(params?.id);
  const path = PATHS.find((candidate) => candidate.id === id);
  if (!path) return { notFound: true };

  return { props: { path, markdown: await readGuide(id) } };
};

const PathDetail = ({ path, markdown }: PathDetailProps) => (
  <>
    <Meta pageTitle={path.name} description={path.description} pageUrl={`paths/${path.id}`} />
    <PathDetailPage path={path} markdown={markdown} />
  </>
);

export default PathDetail;
