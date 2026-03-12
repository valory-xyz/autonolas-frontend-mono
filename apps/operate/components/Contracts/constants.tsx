import { Flex } from 'antd';
import Image from 'next/image';

import { CHAIN_NAMES } from 'libs/util-constants/src';

import type { AvailableOn } from 'types';

export const TAB_LIVE = 'live';
export const TAB_NOT_AVAILABLE = 'not-available';

export const TAB_OPTIONS = [
  { label: 'Live', value: TAB_LIVE },
  { label: 'Not available', value: TAB_NOT_AVAILABLE },
];

export const FILTER_CONTROL_HEIGHT = 32;
export const FILTER_DROPDOWN_CLASS = 'contracts-filter-select-dropdown';
export const PLATFORM_SELECT_CLASS = 'contracts-platform-select';

export const CHAIN_LOGOS: Partial<Record<number, string>> = {
  1: '/images/ethereum-logo.svg',
  10: '/images/optimism-logo.svg',
  100: '/images/gnosis-logo.svg',
  137: '/images/polygon-logo.svg',
  8_453: '/images/base-logo.svg',
  34_443: '/images/mode-logo.svg',
  42_161: '/images/arbitrum-logo.svg',
  42_220: '/images/celo-logo.svg',
};

export const PLATFORM_OPTIONS: { value: AvailableOn; label: string }[] = [
  { value: 'pearl', label: 'Pearl' },
  { value: 'quickstart', label: 'Quickstart' },
  { value: 'contribute', label: 'Contribute' },
];

export const CHAIN_OPTIONS = [
  { value: 'all', label: 'All chains' },
  ...Object.entries(CHAIN_NAMES)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([chainIdStr, name]) => {
      const chainId = Number(chainIdStr);
      const logoSrc = CHAIN_LOGOS[chainId];
      return {
        value: chainIdStr,
        label: (
          <Flex align="center" gap={8}>
            {logoSrc && <Image src={logoSrc} alt={name} width={16} height={16} />}
            <span>{name}</span>
          </Flex>
        ),
      };
    }),
];
