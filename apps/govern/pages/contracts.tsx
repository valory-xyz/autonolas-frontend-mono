import { GetStaticProps, InferGetStaticPropsType } from 'next';

import { ContractsPage } from 'components/Contracts';
import { Meta } from 'components/Meta';
import { fetchGovernContracts } from 'common-util/functions/fetchContracts';
import { StakingContract } from 'types';

/** ISR: pre-render with fresh data every 5 minutes. */
export const getStaticProps: GetStaticProps<{
  initialContracts: StakingContract[];
}> = async () => {
  try {
    const contracts = await fetchGovernContracts();
    return { props: { initialContracts: contracts }, revalidate: 300 };
  } catch (error) {
    console.error('ISR contracts fetch failed:', error);
    return { props: { initialContracts: [] }, revalidate: 60 };
  }
};

const Contracts = ({ initialContracts }: InferGetStaticPropsType<typeof getStaticProps>) => (
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
