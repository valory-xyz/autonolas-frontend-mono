import { useSelector } from 'react-redux';

import type { RootState } from 'store/types';

export const useHelpers = () => {
  const account = useSelector((state: RootState) => state.setup?.account);
  const chainId = useSelector((state: RootState) => state.setup?.chainId);

  return {
    account,
    chainId,
  };
};
