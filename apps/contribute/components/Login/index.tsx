import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAccount, useBalance } from 'wagmi';

import { LoginV2 } from './LoginV2';
import { setLogout, setUserAccount, setUserBalance } from 'store/setup';

const Login = () => {
  const dispatch = useDispatch();
  const { address, chainId } = useAccount();
  const { data } = useBalance({ address, chainId });

  useEffect(() => {
    if (address) {
      dispatch(setUserAccount(address));
      dispatch(setUserBalance(data?.formatted || 0));
    } else {
      dispatch(setLogout());
    }
  }, [address, chainId, data?.formatted, dispatch]);

  const onConnect = (response: { address?: string; balance?: number }) => {
    dispatch(setUserAccount(response.address ?? null));
    dispatch(setUserBalance(response.balance || 0));
  };

  const onDisconnect = () => {
    dispatch(setLogout());
  };

  return (
    <div>
      <LoginV2 onConnect={onConnect} onDisconnect={onDisconnect} />
    </div>
  );
};

export default Login;
