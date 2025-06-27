import { useEffect } from 'react';
import { connect } from 'react-redux';
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
import { LoginV2 as LoginComponent } from 'components/Login';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  line-height: normal;
  ${MEDIA_QUERY.mobileL} {
    margin-top: 0.5rem;
  }
`;

type LoginProps = {
  setUserAccount: (account: string) => void;
  setUserBalance: (balance: string) => void;
  setChainId: (chainId: number) => void;
  setErrorMessage: (error: string) => void;
  setLogout: () => void;
};

const Login = ({
  setUserAccount,
  setUserBalance,
  setChainId,
  setErrorMessage,
  setLogout,
}: LoginProps) => {
  const { address } = useAccount();
  const { chains } = useConfig();
  const chainId = chains[0]?.id;
  const { data } = useBalance({ address, chainId });

  useEffect(() => {
    if (address) {
      setUserAccount(address);
      setUserBalance(data?.formatted as string);
      setChainId(chainId);
    } else {
      setLogout();
    }
  }, [address]);

  const onConnect = (response: { address: string; balance: string; chainId: number }) => {
    setUserAccount(response.address);
    setUserBalance(response.balance);
    setChainId(response.chainId);
  };

  const onDisconnect = () => {
    setLogout();
  };

  return (
    <LoginContainer>
      <LoginComponent onConnect={onConnect} onDisconnect={onDisconnect} />
    </LoginContainer>
  );
};

const mapDispatchToProps = {
  setUserAccount: setUserAccountFn,
  setUserBalance: setUserBalanceFn,
  setChainId: setChainIdFn,
  setErrorMessage: setErrorMessageFn,
  setLogout: setLogoutFn,
};

export default connect(null, mapDispatchToProps)(Login);
