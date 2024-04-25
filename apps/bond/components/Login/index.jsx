import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAccount, useBalance } from 'wagmi';
import {
  setUserAccount,
  setUserBalance,
  setErrorMessage,
  setLogout,
} from 'store/setup';
import { LoginV2 } from 'common-util/Login';

const Login = () => {
  const dispatch = useDispatch();
  const { address, chainId } = useAccount();
  const { data } = useBalance({ address, chainId });

  useEffect(() => {
    if (address) {
      dispatch(setUserAccount(address));
      dispatch(setUserBalance(data?.formatted));
    } else {
      dispatch(setLogout());
    }
  }, [address, data?.formatted, dispatch]);

  const onConnect = (response) => {
    dispatch(setUserAccount(response.address));
    dispatch(setUserBalance(response.balance));
  };

  const onDisconnect = () => {
    dispatch(setLogout());
  };

  const onError = (error) => {
    dispatch(setErrorMessage(error));
  };

  return (
    <div>
      <LoginV2
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onError={onError}
      />
    </div>
  );
};

export default Login;
