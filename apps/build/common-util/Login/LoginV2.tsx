import { useEffect } from 'react';
import { useAccount, useBalance, useConfig } from 'wagmi';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { setChainId } from 'store/setup/actions';
import {
  getChainId,
  getChainIdOrDefaultToMainnet,
} from 'common-util/functions';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: normal;
`;

type LoginV2Props = {
  onConnect: (props: {
    address: string;
    balance: string;
    chainId: number;
  }) => void;
  onDisconnect: () => void;
};

export const LoginV2 = ({
  onConnect: onConnectCb,
  onDisconnect: onDisconnectCb,
}: LoginV2Props) => {
  const dispatch = useDispatch();
  const { address } = useAccount();
  const { chains } = useConfig();
  const { data } = useBalance({ address });

  const chainId = chains[0]?.id;

  useEffect(() => {
    // if chainId is undefined, the wallet is not connected & default to mainnet
    if (chainId === undefined) {
      /**
       * wait for 100ms to get the chainId & set it to redux to avoid race condition
       * and dependent components are loaded once the chainId is set
       */
      setTimeout(() => {
        const tempChainId = getChainId();
        dispatch(setChainId(tempChainId as number));
      }, 100);
    } else {
      const tempChainId = getChainIdOrDefaultToMainnet(chainId);
      dispatch(setChainId(tempChainId));
    }
  }, [chainId]);

  const { connector } = useAccount({
    // @ts-expect-error
    onConnect: ({ address: currentAddress }: { address: string }) => {
      if (onConnectCb) {
        onConnectCb({
          address: address || currentAddress,
          balance: data?.formatted || '',
          chainId,
        });
      }
    },
    onDisconnect() {
      if (onDisconnectCb) onDisconnectCb();
    },
  });

  useEffect(() => {
    const getData = async () => {
      try {
        // This is the initial `provider` that is returned when
        // using web3Modal to connect. Can be MetaMask or WalletConnect.
        const modalProvider =
          // @ts-expect-error
          connector?.options?.getProvider?.() ||
          (await connector?.getProvider?.());

        if (modalProvider) {
          // *******************************************************
          // ************ setting to the window object! ************
          // *******************************************************
          window.MODAL_PROVIDER = modalProvider;

          if (modalProvider?.on) {
            // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
            const handleChainChanged = () => {
              window.location.reload();
            };

            modalProvider.on('chainChanged', handleChainChanged);

            // cleanup
            return () => {
              if (modalProvider.removeListener) {
                modalProvider.removeListener(
                  'chainChanged',
                  handleChainChanged,
                );
              }
            };
          }
        }

        return () => null;
      } catch (error) {
        console.error(error);
        return () => null;
      }
    };

    getData();
  }, [connector]);

  return (
    <LoginContainer>
      <w3m-button balance="hide" />
    </LoginContainer>
  );
};
