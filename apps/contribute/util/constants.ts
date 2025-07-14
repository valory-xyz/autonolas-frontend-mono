export const GATEWAY_URL = 'https://gateway.autonolas.tech/ipfs/';

export const SITE_URL = 'https://contribute.olas.network';
export const SITE_TITLE = 'Olas Contribute';
export const SITE_DESCRIPTION =
  'Contribute to the Olas DAO by completing actions, earning points, climbing the rankings and upgrading your badge';
export const SITE_META_TAG_IMAGE = `${SITE_URL}/images/site-metadata/site-metatag.jpg`;

export const META_TAGS_INFO = {
  siteUrl: SITE_URL,
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  image: SITE_META_TAG_IMAGE,
};

export const MENU_WIDTH = 248;

export const DEFAULT_COORDINATE_ID = '2';

export const MAX_TWEET_LENGTH = 280;
export const MAX_TWEET_IMAGES = 4;

export const PREDICT_BASE_URL = process.env.NEXT_PUBLIC_PREDICT_BASE_URL;
export const PREDICT_PROPOSE_ENDPOINT = '/propose_market';
export const PREDICT_APPROVE_ENDPOINT = '/approve_market';
export const PREDICT_GET_ALL_ENDPOINT = '/all_markets';

export const ONE_MILLION = 1000000;
export const VEOLAS_QUORUM = ONE_MILLION * 2;
export const ONE_IN_WEI = '1000000000000000000';
export const HUNDRED_K_OLAS_IN_WEI = '100000000000000000000000';

export const VEOLAS_URL = 'https://govern.olas.network/veolas';
export const GOVERN_APP_URL = 'https://govern.olas.network';
export const OPERATE_APP_URL = 'https://operate.olas.network';

export const STAKING_CONTRACTS_DETAILS: Record<
  string,
  {
    name: string;
    totalBond: number;
    pointsPerEpoch: number;
    maxSlots: number;
    isDeprecated?: boolean;
  }
> = {
  '0x95146Adf659f455f300D7521B3b62A3b6c4aBA1F': {
    name: 'Contribute Alpha',
    totalBond: 100,
    pointsPerEpoch: 200,
    maxSlots: 100,
    isDeprecated: true,
  },
  '0x2C8a5aC7B431ce04a037747519BA475884BCe2Fb': {
    name: 'Contribute Alpha 2',
    totalBond: 100,
    pointsPerEpoch: 200,
    maxSlots: 100,
    isDeprecated: true,
  },
  '0x708E511d5fcB3bd5a5d42F42aA9a69EC5B0Ee2E8': {
    name: 'Contribute Alpha 3',
    totalBond: 500,
    pointsPerEpoch: 1000,
    maxSlots: 100,
    isDeprecated: true,
  },
  '0xe2E68dDafbdC0Ae48E39cDd1E778298e9d865cF4': {
    name: 'Contribute Beta I',
    totalBond: 100,
    pointsPerEpoch: 200,
    maxSlots: 10,
  },
  '0x6Ce93E724606c365Fc882D4D6dfb4A0a35fE2387': {
    name: 'Contribute Beta II',
    totalBond: 300,
    pointsPerEpoch: 450,
    maxSlots: 10,
  },
  '0x28877FFc6583170a4C9eD0121fc3195d06fd3A26': {
    name: 'Contribute Beta III',
    totalBond: 500,
    pointsPerEpoch: 700,
    maxSlots: 10,
  },
};

export const DEPRECATED_CONTRACTS_ADDRESSES = Object.entries(STAKING_CONTRACTS_DETAILS).reduce<
  string[]
>((acc, [address, item]) => {
  if (item.isDeprecated) acc.push(address);
  return acc;
}, []);

export const STAKING_CONTRACTS_BASE_SUBGRAPH_URL = `${process.env.NEXT_PUBLIC_STAKING_CONTRACTS_BASE_SUBGRAPH_URL}`;
export const OLAS_UNICODE_SYMBOL = '☴';
export const SERVICE_STAKING_STATE = ['Unstaked', 'Staked', 'Evicted'];

export const SUPPORT_URL = 'https://discord.com/channels/899649805582737479/899649805582737482';
