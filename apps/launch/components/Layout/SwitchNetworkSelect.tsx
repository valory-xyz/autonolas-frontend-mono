import { Select } from 'antd';
import { useRouter } from 'next/router';
import { FC } from 'react';

import { useScreen } from '@autonolas/frontend-library';

import {
  ALL_SUPPORTED_CHAINS,
  PAGES_TO_LOAD_WITH_CHAIN_ID,
} from 'common-util/config/supportedChains';
import { useAppDispatch } from 'store/index';
import { setContractsLoading } from 'store/launch';

const networkSelectOptions = ALL_SUPPORTED_CHAINS.map((e) => ({
  label: e.networkDisplayName,
  value: e.networkName,
}));

export const SwitchNetworkSelect: FC = () => {
  const router = useRouter();
  const { isMobile } = useScreen();
  const path = router?.pathname || '';
  const dispatch = useAppDispatch();

  const chainName = (router?.query?.network || 'ethereum') as string;

  return (
    <div style={{ marginRight: isMobile ? 8 : 0 }}>
      <Select
        showSearch
        className="show-scrollbar"
        style={{ width: isMobile ? 140 : 200 }}
        listHeight={800}
        value={chainName}
        placeholder="Select Network"
        disabled={!PAGES_TO_LOAD_WITH_CHAIN_ID.some((e) => path.includes(e))}
        options={networkSelectOptions}
        onChange={async (value) => {
          // Set loading state
          dispatch(setContractsLoading());

          // Change route
          const replacedPath = router.asPath.replace(chainName, value);
          router.push(replacedPath);
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
