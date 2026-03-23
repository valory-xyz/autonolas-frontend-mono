import { GetServerSideProps, InferGetServerSidePropsType } from 'next';

import { withTimeout } from 'libs/util-functions/src';

import { Meta } from 'components/Meta';
import { ContractsPage } from 'components/Contracts';
import { fetchGovernContracts } from 'common-util/functions/fetchContracts';
import { StakingContract } from 'types';

const SSR_TIMEOUT_MS = 8000;

export const getServerSideProps: GetServerSideProps<{
  initialContracts: StakingContract[];
}> = async () => {
  try {
    const contracts = await withTimeout(fetchGovernContracts(), SSR_TIMEOUT_MS);
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
      description="Browse and vote for Olas staking contracts. View contract details and vote emissions towards them using your veOLAS."
      pageUrl="contracts"
    />
    <ContractsPage initialContracts={initialContracts} />
  </>
);

export default Contracts;
