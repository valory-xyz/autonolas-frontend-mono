import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { setErrorMessage, setLogout, setUserAccount } from 'store/setup';

import { LoginV2 } from 'common-util/Login';
import { useHelpers } from 'common-util/hooks';

const Login = () => {
  const dispatch = useDispatch();
  const { isSvm } = useHelpers();

  const onConnect = useCallback(
    (response: { address: string }) => {
      dispatch(setUserAccount(response.address));
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
