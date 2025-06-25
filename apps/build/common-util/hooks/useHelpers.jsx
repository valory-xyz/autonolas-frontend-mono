import { useSelector } from 'react-redux';

export const useHelpers = () => {
  const account = useSelector((state) => state?.setup?.account);
  const chainId = useSelector((state) => state?.setup?.chainId);

  return {
    account,
    chainId,
  };
};
