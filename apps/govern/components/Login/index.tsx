import { useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useBalance } from 'wagmi';

import { setChainId, setLogout, setUserAccount, setUserBalance } from 'store/setup';

import { LoginV2 } from 'common-util/Login';
import { useAppDispatch, useAppSelector } from 'store/index';

const Login = () => {
  const dispatch = useAppDispatch();
  const { account } = useAppSelector((state) => state.setup);

  const onConnect = useCallback(
    (response: { address: `0x${string}` | undefined; chainId: number | undefined }) => {
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
