import { Select } from 'antd';
import { useRouter } from 'next/router';

import { ALL_SUPPORTED_CHAINS, FIRST_SUPPORTED_CHAIN } from 'common-util/Login/config';
import { useScreen } from 'common-util/hooks';
import { PAGES_TO_LOAD_WITHOUT_CHAIN_ID } from 'util/constants';

const networkSelectOptions = ALL_SUPPORTED_CHAINS.map((e) => ({
  label: e.networkDisplayName,
  value: e.networkName,
}));

export const SwitchNetworkSelect = () => {
  const router = useRouter();
  const { isMobile } = useScreen();
  const path = router?.pathname || '';
  const chainName = (router?.query?.network || FIRST_SUPPORTED_CHAIN.networkName) as string;

  return (
    <div style={{ marginRight: 8 }}>
      <Select
        showSearch
        className="show-scrollbar"
        style={{ width: isMobile ? 140 : 200 }}
        value={chainName}
        placeholder="Select Network"
        disabled={PAGES_TO_LOAD_WITHOUT_CHAIN_ID.some((e) => path.includes(e))}
        options={networkSelectOptions}
        onChange={(value) => {
          const currentChainInfo = ALL_SUPPORTED_CHAINS.find((e) => e.networkName === value);

          if (currentChainInfo) {
            if (PAGES_TO_LOAD_WITHOUT_CHAIN_ID.find((e) => e === path)) {
              // eg. /docs will be redirect to same page ie. /docs
              router.push(`/${path}`);
            } else {
              // eg. /mechs will be redirect to /<chainName>/mechs
              const replacedPath = router.asPath.replace(chainName, value);
              router.push(replacedPath);
            }
          }
        }}
      />
    </div>
  );
};
