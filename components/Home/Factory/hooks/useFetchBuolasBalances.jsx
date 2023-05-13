import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBuolasDetails } from 'store/setup/actions';

export const useFetchBuolasBalances = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state?.setup?.account);
  const chainId = useSelector((state) => state?.setup?.chainId);
  const buolasBalance = useSelector(
    (state) => state?.setup?.buolasBalance || null,
  );
  const buolasReleasableAmount = useSelector(
    (state) => state?.setup?.buolasReleasableAmount || null,
  );
  const mappedBalances = useSelector(
    (state) => state?.setup?.buolasMappedBalances || null,
  );
  const buolasNextReleasableAmount = useSelector(
    (state) => state?.setup?.buolasNextReleasableAmount || null,
  );
  const buolasNextReleasableTime = useSelector(
    (state) => state?.setup?.buolasNextReleasableTime || null,
  );

  const [isLoading, setIsLoading] = useState(!!account);

  const getData = () => {
    dispatch(fetchBuolasDetails());
  };

  useEffect(() => {
    const fn = async () => {
      if (account && chainId) {
        setIsLoading(true);
        try {
          getData();
        } catch (error) {
          window.console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fn();
  }, [account, chainId]);

  return {
    isLoading,
    account,
    chainId,
    buolasBalance,
    buolasReleasableAmount,
    mappedBalances,
    buolasNextReleasableAmount,
    buolasNextReleasableTime,
    getData,
  };
};
