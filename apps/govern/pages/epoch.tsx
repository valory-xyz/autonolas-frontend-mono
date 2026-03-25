import { EpochPage } from 'components/Epoch';
import { Meta } from 'components/Meta';

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
