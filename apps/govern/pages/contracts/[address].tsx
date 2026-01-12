import { Meta } from 'components/Meta';
import { ContractPage } from 'components/Contract';

const Contract = () => (
  <>
    <Meta
      pageTitle="Contract Details"
      description="View detailed information about a specific Olas protocol smart contract, including its address, ABI, and interaction capabilities."
      pageUrl="contracts"
    />
    <ContractPage />
  </>
);

export default Contract;
