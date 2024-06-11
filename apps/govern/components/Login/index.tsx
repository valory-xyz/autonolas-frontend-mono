import { ethers } from 'ethers';
import { useCallback, useEffect } from 'react';
import { Address } from 'types/index';
import { useBalance } from 'wagmi';

import { useAppDispatch, useAppSelector } from 'store/index';
import { setChainId, setLogout, setUserAccount, setUserBalance } from 'store/setup';

import { LoginV2 } from 'common-util/Login';

const Login = () => {
  const dispatch = useAppDispatch();
  const { account } = useAppSelector((state) => state.setup);

  const onConnect = useCallback(
    (response: { address: Address | undefined; chainId: number | undefined }) => {
      dispatch(setUserAccount(response.address));
      dispatch(setChainId(response.chainId));
    },
    [dispatch],
  );

  const onDisconnect = useCallback(() => {
    dispatch(setLogout());
  }, [dispatch]);

  const { data: balance } = useBalance({ address: account });
  useEffect(() => {
    if (balance) {
      const formattedBalance = ethers.formatUnits(balance.value, balance.decimals);
      dispatch(setUserBalance(formattedBalance));
    }
  }, [balance, dispatch]);

  return <LoginV2 onConnect={onConnect} onDisconnect={onDisconnect} />;
};

export default Login;
