import { Meta } from 'components/Meta';
import { ContractsPage } from '../components/Contracts';

const Contracts = () => (
  <>
    <Meta
      pageTitle="Staking Contracts"
      description="Browse and vote for Olas staking contracts. View contract details and vote emissions towards them using your veOLAS."
      pageUrl="contracts"
    />
    <ContractsPage />
  </>
);

export default Contracts;
