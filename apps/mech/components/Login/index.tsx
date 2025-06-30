import { useEffect } from 'react';
import { connect } from 'react-redux';
import { useAccount, useBalance } from 'wagmi';
import type { Address } from 'viem';

import { LoginV2 as LoginComponent } from 'components/Login/LoginV2';
import {
  setLogout as setLogoutFn,
  setUserAccount as setUserAccountFn,
  setUserBalance as setUserBalanceFn,
} from 'store/setup/actions';

type LoginProps = {
  setUserAccount: (address: string) => void;
  setUserBalance: (balance: string) => void;
  setLogout: () => void;
};

const Login = ({ setUserAccount, setUserBalance, setLogout }: LoginProps) => {
  const { address, chain } = useAccount();
  const chainId = chain?.id;
  const { data } = useBalance({ address, chainId });

  useEffect(() => {
    if (address) {
      setUserAccount(address);
      setUserBalance(data?.formatted ?? '');
    } else {
      setLogout();
    }
  }, [address, chainId, data?.formatted, setLogout, setUserAccount, setUserBalance]);

  const onConnect = (response: { address: Address | undefined; balance: string | undefined }) => {
    setUserAccount(response.address ?? '');
    setUserBalance(response.balance ?? '');
  };

  const onDisconnect = () => {
    setLogout();
  };

  return (
    <div>
      <LoginComponent onConnect={onConnect} onDisconnect={onDisconnect} />
    </div>
  );
};

const mapDispatchToProps = {
  setUserAccount: setUserAccountFn,
  setUserBalance: setUserBalanceFn,
  setLogout: setLogoutFn,
};

export default connect(null, mapDispatchToProps)(Login);
