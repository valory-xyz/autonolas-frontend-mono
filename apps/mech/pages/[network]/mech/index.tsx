import get from 'lodash/get';
import { GetServerSideProps } from 'next';

import Mech from 'components/Mech';
import { DEFAULT_MECH_CONTRACT_ADDRESS } from 'util/constants';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query } = ctx;
  const id = get(query, 'id');

  if (!id) {
    return {
      redirect: {
        destination: `/mech/${DEFAULT_MECH_CONTRACT_ADDRESS}`,
        permanent: true,
      },
    };
  }

  return {
    props: {},
  };
};

export default Mech;
