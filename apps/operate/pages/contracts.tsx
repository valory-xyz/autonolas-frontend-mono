import { InferGetStaticPropsType } from 'next';

import { createSnapshotGetStaticProps } from 'libs/util-ssr/src';

import { Meta } from 'components/Meta';
import { ContractsPage } from 'components/Contracts';
import { fetchOperateContracts } from 'common-util/functions/fetchContracts';
import { StakingContract } from 'types';

/** Budget for the whole fan-out (nominees + subgraph + per-contract RPC).
 *  Kept below the `maxDuration` set for this page in vercel.json, or the platform would cut
 *  the fetch short first. 45 s was not enough: the govern fan-out measured ~36 s once and then
 *  exceeded 45 s on the next run, which would intermittently ship the fallback instead of the
 *  table. */
const ISR_TIMEOUT_MS = 90_000;
/** Contract config moves slowly, and the client refreshes live figures after hydration. */
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
  fetchSnapshot: fetchOperateContracts,
  emptyValue: [],
  timeoutMs: ISR_TIMEOUT_MS,
  revalidateSeconds: REVALIDATE_SECONDS,
  revalidateOnErrorSeconds: REVALIDATE_ON_ERROR_SECONDS,
  label: 'operate/contracts',
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
      description="View available staking contracts for AI agent services. Find opportunities to stake your assets and earn rewards by operating decentralized AI agents."
      pageUrl="contracts"
    />
    <ContractsPage initialContracts={initialContracts} snapshotGeneratedAt={snapshotGeneratedAt} />
  </>
);

export default Contracts;
