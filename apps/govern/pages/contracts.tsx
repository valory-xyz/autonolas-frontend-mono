import { InferGetStaticPropsType } from 'next';

import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { ContractsPage } from 'components/Contracts';
import { Meta } from 'components/Meta';
import { fetchGovernContracts } from 'common-util/functions/fetchContracts';
import { StakingContract } from 'types';

/**
 * Vercel cuts the function short whatever `ISR_TIMEOUT_MS` says, so the two are set together
 * here. 45 s was not enough for this fan-out; it ran ~36 s once and over 45 s the next time.
 */
export const config = { maxDuration: 120 };

/** Budget for the whole fan-out (nominees + weights + per-contract metadata). */
const ISR_TIMEOUT_MS = 90_000;

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
