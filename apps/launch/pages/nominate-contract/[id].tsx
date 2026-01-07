import { Meta } from 'components/Meta';
import { NominateContract } from 'components/NominateContract';

const NominateContractPage = () => (
  <>
    <Meta
      pageTitle="Nominate Contract"
      description="Nominate a staking contract for your AI agent service. Submit your contract for review and inclusion in the Olas staking ecosystem."
      pageUrl="nominate-contract"
    />
    <NominateContract />
  </>
);

export default NominateContractPage;
