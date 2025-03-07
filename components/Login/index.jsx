import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { connect } from 'react-redux';
import { useAccount, useBalance, useChainId } from 'wagmi';

import { LoginV2 as LoginComponent } from 'common-util/Login';
import {
  setChainId as setChainIdFn,
  setErrorMessage as setErrorMessageFn,
  setLogout as setLogoutFn,
  setUserAccount as setUserAccountFn,
  setUserBalance as setUserBalanceFn,
} from 'store/setup/actions';

const Login = ({ setUserAccount, setUserBalance, setErrorMessage, setLogout }) => {
  const { address, chain } = useAccount();
  const chainId = chain?.id;
  const { data } = useBalance({ address, chainId });

  useEffect(() => {
    if (address) {
      setUserAccount(address);
      setUserBalance(data?.formatted);
    } else {
      setLogout();
    }
  }, [address, chainId, data?.formatted, setLogout, setUserAccount, setUserBalance]);

  const onConnect = (response) => {
    setUserAccount(response.address);
    setUserBalance(response.balance);
  };

  const onDisconnect = () => {
    setLogout();
  };

  const onError = (error) => {
    setErrorMessage(error);
  };

  return (
    <div>
      <LoginComponent onConnect={onConnect} onDisconnect={onDisconnect} onError={onError} />
    </div>
  );
};

Login.propTypes = {
  setUserAccount: PropTypes.func.isRequired,
  setUserBalance: PropTypes.func.isRequired,
  setErrorMessage: PropTypes.func.isRequired,
  setLogout: PropTypes.func.isRequired,
};

Login.defaultProps = {};

const mapDispatchToProps = {
  setUserAccount: setUserAccountFn,
  setUserBalance: setUserBalanceFn,
  setErrorMessage: setErrorMessageFn,
  setLogout: setLogoutFn,
};

export default connect(null, mapDispatchToProps)(Login);
