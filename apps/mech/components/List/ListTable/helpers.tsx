import type { NextRouter } from 'next/router';

import { AddressLink, NA } from '@autonolas/frontend-library';

import { SUPPORTED_CHAINS } from 'components/Login/config';
import { FIRST_SUPPORTED_CHAIN } from 'components/Login/config';
import { getChainId } from 'common-util/functions';
import { NAV_TYPES, REGISTRY_URL, TOTAL_VIEW_COUNT } from 'util/constants';

import { AddressHashLink } from './AgentHashLink';

export const getTableColumns = (
  type: string,
  { router, isMobile }: { router: NextRouter; isMobile?: boolean },
) => {
  const networkName = router?.query?.network ?? FIRST_SUPPORTED_CHAIN.networkName;
  const chainId = getChainId();

  const addressLinkProps = {
    suffixCount: isMobile ? 4 : 6,
    canCopy: true,
    textMinWidth: 160,
    chainId,
  };

  if (type === NAV_TYPES.AGENT) {
    return [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 50,
      },
      {
        title: 'Owner',
        dataIndex: 'owner',
        key: 'owner',
        width: 200,
        render: (text: string) => (
          <AddressLink text={text} {...addressLinkProps} supportedChains={SUPPORTED_CHAINS} />
        ),
      },
      {
        title: 'Hash',
        dataIndex: 'hash',
        key: 'hash',
        width: 200,
        render: (text: string) => <AddressLink text={text} {...addressLinkProps} isIpfsLink />,
      },
      {
        title: 'Mech',
        dataIndex: 'mech',
        width: 180,
        key: 'mech',
        render: (text: string, row: AgentData) => {
          if (!text) return NA;
          return (
            <AddressLink
              text={text}
              {...addressLinkProps}
              onClick={(e) => {
                if (router) router.push(`/${networkName}/mech/${e}/${row.hash}?legacy=true`);
              }}
            />
          );
        },
      },
    ];
  }

  if (type === NAV_TYPES.SERVICE) {
    return [
      {
        title: 'Service ID',
        dataIndex: 'id',
        key: 'id',
        width: 50,
        render: (text: string) => (
          <a
            href={`${REGISTRY_URL}/${networkName}/services/${text}`}
            target="_blank"
            rel="noreferrer"
          >
            {text}
          </a>
        ),
      },
      {
        title: 'Owner',
        dataIndex: 'owner',
        key: 'owner',
        width: 160,
        render: (text: string) => (
          <AddressLink text={text} {...addressLinkProps} supportedChains={SUPPORTED_CHAINS} />
        ),
      },
      {
        title: 'Hash',
        dataIndex: 'hash',
        key: 'hash',
        width: 160,
        render: (_text: string, record: ServiceData) => (
          <AddressHashLink {...addressLinkProps} serviceId={record.id} />
        ),
      },
      {
        title: 'Mech',
        dataIndex: 'mech',
        width: 160,
        key: 'mech',
        render: (text: string) => {
          if (!text) return NA;
          return (
            <AddressLink
              text={text}
              {...addressLinkProps}
              onClick={() => {
                if (router) router.push(`/${networkName}/mech/${text}`);
              }}
            />
          );
        },
      },
      {
        title: 'Mech Factory',
        dataIndex: 'mechFactory',
        width: 160,
        key: 'mechFactory',
        render: (text: string) => (
          <AddressLink text={text} {...addressLinkProps} supportedChains={SUPPORTED_CHAINS} />
        ),
      },
    ];
  }

  return [];
};

export type Item = {
  id: string;
  description: string;
  developer: string;
  owner: string;
  hash: string;
  mech: string;
  dependencies: Array<string>;
  address: string;
  mechFactory: string;
};

export type AgentData = {
  id: string;
  description: string;
  developer: string;
  owner: string;
  hash: string;
  mech: string;
  dependency: number;
};

export type ServiceData = {
  id: string;
  owner: string;
  hash: string;
  mech: string;
  mechFactory: string;
};

export const getData = (type: string, rawData: Item[], { current }: { current: number }) => {
  /**
   * @example
   * TOTAL_VIEW_COUNT = 10, current = 1
   * start = ((1 - 1) * 10) + 1
   *       = (0 * 10) + 1
   *       = 1
   * TOTAL_VIEW_COUNT = 10, current = 1
   * start = ((5 - 1) * 10) + 1
   *       = 40 + 1
   *       = 41
   */
  const startIndex = (current - 1) * TOTAL_VIEW_COUNT + 1;
  let data: AgentData[] | ServiceData[] = [];

  if (type === NAV_TYPES.AGENT) {
    data = rawData.map((item, index) => ({
      id: item.id || `${startIndex + index}`,
      description: item.description || '-',
      developer: item.developer || '-',
      owner: item.owner || '-',
      hash: item.hash || '-',
      mech: item.mech,
      dependency: (item.dependencies || []).length,
    }));
  }

  if (type === NAV_TYPES.SERVICE) {
    data = rawData.map((item) => ({
      id: item.id,
      owner: item.owner || '-',
      hash: item.hash,
      mech: item.address,
      mechFactory: item.mechFactory,
    }));
  }

  return data;
};

/**
 * returns hash from the url
 * @example
 * input: router-path (for example, /components#my-components)
 * output: my-components
 */
export const getHash = (router: NextRouter) => router?.asPath?.split('#')[1] || '';

/**
 * my-components/my-agents/my-serices has "my" in common hence returns
 */
export const isMyTab = (hash: string) => !!(hash || '').includes('my-');
