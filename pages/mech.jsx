import get from 'lodash/get';
import Mech from 'components/Home/Mech';
import {
  DEFAULT_MECH_CONTRACT_ADDRESS,
  DEFAULT_MECH_HASH,
} from 'util/constants';

export async function getServerSideProps(ctx) {
  const { query } = ctx;
  const id = get(query, 'id');

  if (!id) {
    return {
      redirect: {
        destination: `/mech?id=${DEFAULT_MECH_CONTRACT_ADDRESS}&hash=${DEFAULT_MECH_HASH}`,
        permanent: true,
      },
    };
  }

  return {
    props: {},
  };
}

export default Mech;
