import { Select } from 'antd';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { useSwitchChain } from 'wagmi';

import { useScreen } from '@autonolas/frontend-library';

import {
  ALL_SUPPORTED_CHAINS,
  PAGES_TO_LOAD_WITHOUT_CHAINID,
} from 'common-util/config/supportedChains';

import { useHandleRoute } from './useHandleRoute';

export const SwitchNetworkSelect: FC = () => {
  const router = useRouter();
  const { isMobile } = useScreen();
  const { switchChainAsync } = useSwitchChain();
  const path = router?.pathname || '';

  const chainName = (router?.query?.network || 'ethereum') as string;

  // handle the routing
  useHandleRoute();

  return (
    <div style={{ marginRight: isMobile ? 8 : 0 }}>
      <Select
        showSearch
        className="show-scrollbar"
        style={{ width: isMobile ? 140 : 200 }}
        listHeight={800}
        value={chainName}
        placeholder="Select Network"
        disabled={PAGES_TO_LOAD_WITHOUT_CHAINID.some((e) => path.includes(e))}
        options={ALL_SUPPORTED_CHAINS.map((e) => ({
          label: e.networkDisplayName,
          value: e.networkName,
        }))}
        onChange={async (value) => {
          const currentChainInfo = ALL_SUPPORTED_CHAINS.find((e) => e.networkName === value);

          if (!currentChainInfo) return;

          if (PAGES_TO_LOAD_WITHOUT_CHAINID.find((e) => e === path)) {
            // eg. /disclaimer will be redirect to same page ie. /disclaimer
            await switchChainAsync({ chainId: currentChainInfo.id });
            router.push(`/${path}`);
          } else {
            // eg. /values will be redirect to /<chainName>/values,
            const replacedPath = router.asPath.replace(chainName, value);

            // reload the page if vmType is different
            // ie. user switched from svm to eth or vice versa
            // or if the current chain selected is ethereum
            window.open(replacedPath, '_self');
            // router.push(replacedPath);
          }
        }}
        filterOption={(input, option) => {
          if (!option) return false;

          const { label } = option;
          return label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
        }}
      />
    </div>
  );
};
