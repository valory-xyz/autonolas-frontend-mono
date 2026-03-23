import { GetServerSideProps, InferGetServerSidePropsType } from 'next';

import { withTimeout } from 'libs/util-functions/src';

import { Meta } from 'components/Meta';
import { ContractsPage } from 'components/Contracts';
import { fetchOperateContracts } from 'common-util/functions/fetchContracts';
import { StakingContract } from 'types';

const SSR_TIMEOUT_MS = 8000;

export const getServerSideProps: GetServerSideProps<{
  initialContracts: StakingContract[];
}> = async () => {
  try {
    const contracts = await withTimeout(fetchOperateContracts(), SSR_TIMEOUT_MS);
    return { props: { initialContracts: contracts } };
  } catch (error) {
    console.error('SSR contracts fetch failed:', error);
    return { props: { initialContracts: [] } };
  }
};

const Contracts = ({
  initialContracts,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <>
    <Meta
      pageTitle="Staking Contracts"
      description="View available staking contracts for AI agent services. Find opportunities to stake your assets and earn rewards by operating decentralized AI agents."
      pageUrl="contracts"
    />
    <ContractsPage initialContracts={initialContracts} />
  </>
);

export default Contracts;
