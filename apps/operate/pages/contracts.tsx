import { Meta } from 'components/Meta';
import { ContractsPage } from 'components/Contracts';

const Contracts = () => (
  <>
    <Meta
      pageTitle="Staking Contracts"
      description="View available staking contracts for AI agent services. Find opportunities to stake your assets and earn rewards by operating decentralized AI agents."
      pageUrl="contracts"
    />
    <ContractsPage />
  </>
);

export default Contracts;
