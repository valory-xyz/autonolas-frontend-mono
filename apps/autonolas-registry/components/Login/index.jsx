import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAccount, useBalance } from 'wagmi';
import { setUserAccount, setUserBalance, setErrorMessage, setLogout } from 'store/setup';
import { LoginV2 } from 'common-util/Login';
import { useHelpers } from 'common-util/hooks';

const Login = () => {
  const dispatch = useDispatch();
  const { chainId, isSvm } = useHelpers();
  const { address } = useAccount();
  const { data } = useBalance({ address, chainId });
  const formattedBalance = data?.formatted;

  useEffect(() => {
    if (address) {
      dispatch(setUserAccount(address));
      dispatch(setUserBalance(formattedBalance));
    } else {
      dispatch(setLogout());
    }
  }, [address, formattedBalance, dispatch]);

  const onConnect = useCallback(
    (response) => {
      dispatch(setUserAccount(response.address));
      dispatch(setUserBalance(response.balance));
    },
    [dispatch],
  );

  const onDisconnect = useCallback(() => {
    dispatch(setLogout());
  }, [dispatch]);

  const onError = useCallback(
    (error) => {
      dispatch(setErrorMessage(error));
    },
    [dispatch],
  );

  return (
    <div>
      <LoginV2 isSvm={isSvm} onConnect={onConnect} onDisconnect={onDisconnect} onError={onError} />
    </div>
  );
};

export default Login;
