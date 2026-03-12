import { Meta } from 'components/Meta';
import { EpochPage } from 'components/Epoch';

const Epoch = () => (
  <>
    <Meta
      pageTitle="Epoch"
      description="View current epoch information, checkpoint the epoch, and claim staking incentives for staking contracts in the Olas ecosystem."
      pageUrl="epoch"
    />
    <EpochPage />
  </>
);

export default Epoch;
