import { InferGetStaticPropsType } from 'next';

import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { ContractsPage } from 'components/Contracts';
import { Meta } from 'components/Meta';
import { fetchGovernContracts } from 'common-util/functions/fetchContracts';
import { StakingContract } from 'types';

/** Budget for the whole fan-out (nominees + weights + per-contract metadata).
 *  Keep below the deployment's function `maxDuration` or the platform cuts it short first. */
const ISR_TIMEOUT_MS = 45_000;
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
