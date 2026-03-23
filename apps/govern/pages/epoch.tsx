import { GetServerSideProps, InferGetServerSidePropsType } from 'next';

import { withTimeout } from 'libs/util-functions/src';

import { Meta } from 'components/Meta';
import { EpochPage } from 'components/Epoch';
import { EpochData, fetchEpochData } from 'common-util/functions/fetchEpochData';

const SSR_TIMEOUT_MS = 8000;

export const getServerSideProps: GetServerSideProps<{
  initialEpochData: EpochData | null;
}> = async () => {
  try {
    const data = await withTimeout(fetchEpochData(), SSR_TIMEOUT_MS);
    return { props: { initialEpochData: data } };
  } catch (error) {
    console.error('SSR epoch data fetch failed:', error);
    return { props: { initialEpochData: null } };
  }
};

const Epoch = ({ initialEpochData }: InferGetServerSidePropsType<typeof getServerSideProps>) => (
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
