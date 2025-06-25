import { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useAccount, useBalance, useConfig } from 'wagmi';
import { MEDIA_QUERY } from '@autonolas/frontend-library';
import {
  setUserAccount as setUserAccountFn,
  setUserBalance as setUserBalanceFn,
  setChainId as setChainIdFn,
  setErrorMessage as setErrorMessageFn,
  setLogout as setLogoutFn,
} from 'store/setup/actions';
import { LoginV2 as LoginComponent } from 'common-util/Login';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  line-height: normal;
  ${MEDIA_QUERY.mobileL} {
    margin-top: 0.5rem;
  }
`;

const Login = ({
  setUserAccount,
  setUserBalance,
  setChainId,
  setErrorMessage,
  setLogout,
}) => {
  const { address } = useAccount();
  const { chains } = useConfig();
  const chainId = chains[0]?.id;
  const { data } = useBalance({ address, chainId });

  useEffect(() => {
    if (address) {
      setUserAccount(address);
      setUserBalance(data?.formatted);
      setChainId(chainId);
    } else {
      setLogout();
    }
  }, [address]);

  const onConnect = (response) => {
    setUserAccount(response.address);
    setUserBalance(response.balance);
    setChainId(response.chainId);
  };

  const onDisconnect = () => {
    setLogout();
  };

  const onError = (error) => {
    setErrorMessage(error);
  };

  return (
    <LoginContainer>
      <LoginComponent
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onError={onError}
      />
    </LoginContainer>
  );
};

Login.propTypes = {
  setUserAccount: PropTypes.func.isRequired,
  setUserBalance: PropTypes.func.isRequired,
  setChainId: PropTypes.func.isRequired,
  setErrorMessage: PropTypes.func.isRequired,
  setLogout: PropTypes.func.isRequired,
};

Login.defaultProps = {};

const mapDispatchToProps = {
  setUserAccount: setUserAccountFn,
  setUserBalance: setUserBalanceFn,
  setChainId: setChainIdFn,
  setErrorMessage: setErrorMessageFn,
  setLogout: setLogoutFn,
};

export default connect(null, mapDispatchToProps)(Login);