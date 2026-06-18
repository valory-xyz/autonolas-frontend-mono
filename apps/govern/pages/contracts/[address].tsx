import { useRouter } from 'next/router';

import { Meta } from 'components/Meta';
import { ContractPage } from 'components/Contract';

const Contract = () => {
  const router = useRouter();
  // Self-referential canonical for the contract detail page. Lowercased so
  // checksummed/lowercase address variants (both serve the same page) collapse
  // onto one canonical, and so SSR matches the CSR canonical from the inner
  // <Meta> in components/Contract (which keys on the same lowercased address).
  const address = String(router.query.address || '').toLowerCase();

  return (
    <>
      <Meta
        pageTitle="Contract Details"
        description="View detailed information about a specific Olas protocol smart contract, including its address, ABI, and interaction capabilities."
        pageUrl={`contracts/${address}`}
      />
      <ContractPage />
    </>
  );
};

export default Contract;
