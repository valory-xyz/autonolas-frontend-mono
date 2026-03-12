import { Meta } from 'components/Meta';
import { ProposalsPage } from 'components/Proposals';

const Proposals = () => (
  <>
    <Meta
      pageTitle="Proposals"
      description="Participate in Olas governance by viewing and voting on active proposals. Help shape the future of the Olas ecosystem through decentralized decision-making."
      pageUrl="proposals"
    />
    <ProposalsPage />
  </>
);

export default Proposals;
