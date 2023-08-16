import get from 'lodash/get';
import Mech from 'components/Home/Mech';
import { DEFAULT_MECH_CONTRACT_ADDRESS } from 'util/constants';

export async function getServerSideProps(ctx) {
  const { query } = ctx;
  const id = get(query, 'id');

  if (!id) {
    return {
      redirect: {
        destination: `/mech?id=${DEFAULT_MECH_CONTRACT_ADDRESS}`,
        permanent: true,
      },
    };
  }

  return {
    props: {},
  };
}

export default Mech;
