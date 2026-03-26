import { GetStaticProps, InferGetStaticPropsType } from 'next';

import { EpochPage } from 'components/Epoch';
import { Meta } from 'components/Meta';
import { EpochData, fetchEpochData } from 'common-util/functions/fetchEpochData';

/** ISR: pre-render epoch data, revalidate every 60 seconds. */
export const getStaticProps: GetStaticProps<{
  initialEpochData: EpochData | null;
}> = async () => {
  try {
    const data = await fetchEpochData();
    return { props: { initialEpochData: data }, revalidate: 60 };
  } catch (error) {
    console.error('ISR epoch data fetch failed:', error);
    return { props: { initialEpochData: null }, revalidate: 30 };
  }
};

const Epoch = ({ initialEpochData }: InferGetStaticPropsType<typeof getStaticProps>) => (
  <>
    <Meta
      pageTitle="Epoch"
      description="View current epoch information, checkpoint the epoch, and claim staking incentives for staking contracts in the Olas ecosystem."
      pageUrl="epoch"
    />
    <EpochPage initialEpochData={initialEpochData} />
  </>
);

export default Epoch;
