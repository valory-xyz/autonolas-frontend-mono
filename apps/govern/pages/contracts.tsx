import { InferGetStaticPropsType } from 'next';

import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { ContractsPage } from 'components/Contracts';
import { Meta } from 'components/Meta';
import { fetchGovernContracts } from 'common-util/functions/fetchContracts';
import { StakingContract } from 'types';

/** Budget for the whole fan-out (nominees + weights + per-contract metadata).
 *  Kept below the `maxDuration` set for this page in vercel.json, or the platform would cut
 *  the fetch short first. 45 s was not enough: the govern fan-out measured ~36 s once and then
 *  exceeded 45 s on the next run, which would intermittently ship the fallback instead of the
 *  table. */
/**
 * Vercel's default function duration is far below what this fetch needs, and it cuts the fetch
 * short whatever `ISR_TIMEOUT_MS` says. Set here rather than in a `vercel.json` so it does not
 * depend on the project's Root Directory being the app folder, and so the two numbers sit
 * together.
 */
export const config = { maxDuration: 120 };

const ISR_TIMEOUT_MS = 90_000;
/** Weights change once a week; the client refreshes them after hydration anyway. */
const REVALIDATE_SECONDS = 300;
const REVALIDATE_ON_ERROR_SECONDS = 60;

/**
 * ISR rather than `getServerSideProps`: this fan-out is far too slow to run per request
 * (see PR #350, which moved this page to client-only after SSR hung serverless workers on slow
 * RPCs). Under ISR the cost is paid once per window. See `createSnapshotGetStaticProps` for why
 * a failed revalidation rethrows instead of returning an empty list.
 */
export const getStaticProps = createSnapshotGetStaticProps<
  StakingContract[],
  { initialContracts: StakingContract[]; snapshotGeneratedAt: string | null }
>({
  fetchSnapshot: fetchGovernContracts,
  emptyValue: [],
  timeoutMs: ISR_TIMEOUT_MS,
  revalidateSeconds: REVALIDATE_SECONDS,
  revalidateOnErrorSeconds: REVALIDATE_ON_ERROR_SECONDS,
  label: 'govern/contracts',
  toProps: ({ data, generatedAt }) => ({
    initialContracts: data,
    snapshotGeneratedAt: generatedAt,
  }),
});

const Contracts = ({
  initialContracts,
  snapshotGeneratedAt,
}: InferGetStaticPropsType<typeof getStaticProps>) => (
  <>
    <Meta
      pageTitle="Staking Contracts"
      description="Browse and vote for Olas staking contracts. View contract details and vote emissions towards them using your veOLAS."
      pageUrl="contracts"
    />
    <ContractsPage initialContracts={initialContracts} snapshotGeneratedAt={snapshotGeneratedAt} />
  </>
);

export default Contracts;
