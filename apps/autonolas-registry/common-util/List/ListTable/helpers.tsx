import type { NextRouter } from 'next/router';
import { Button, Space, Tag } from 'antd';

import { AddressLink, NA, areAddressesEqual } from '@autonolas/frontend-library';

import {
  HASH_PREFIX,
  NAV_TYPES,
  SERVICE_STATE,
  SERVICE_STATE_KEY_MAP,
  TOTAL_VIEW_COUNT,
} from '../../../util/constants';

type Role = 'Demand & Supply' | 'Demand' | 'Supply' | 'Registered';

type Record = {
  id: string;
  role: Role;
  state: string;
  owner: string;
  tokenId: string;
  description: string;
  hash: string;
  packageName: string;
  packageHash: string;
  dependency: number;
  metadataHash: string;
  publicId: string;
  developer: string;
  active: string;
  serviceId: string;
  metadata: string;
  configHash: string;
  unitHash: string;
  dependencies: string[];
};

export const getTableColumns = (
  type: (typeof NAV_TYPES)[keyof typeof NAV_TYPES],
  {
    onViewClick,
    onUpdateClick,
    isMobile,
    account,
    chainId,
    isMainnet,
  }: {
    onViewClick: (id: string) => void;
    onUpdateClick: (id: string) => void;
    isMobile: boolean;
    account: string;
    chainId: number;
    isMainnet: boolean;
  },
) => {
  const addressLinkProps = {
    chainId,
    suffixCount: isMobile ? 4 : 6,
  };

  const tokenIdColumn = {
    title: 'ID',
    dataIndex: 'tokenId',
    key: 'tokenId',
    width: isMobile ? 30 : 50,
  };

  const packageName = {
    title: 'Name',
    dataIndex: 'packageName',
    key: 'packageName',
    width: type === NAV_TYPES.SERVICE ? 200 : 180,
    render: (text: string, record: Record) => {
      if (!text || text === NA) return NA;
      return (
        <Button size="large" type="link" onClick={() => onViewClick(record.id)}>
          {text}
        </Button>
      );
    },
  };

  const hashColumn = {
    title: 'Hash',
    dataIndex: 'hash',
    key: 'hash',
    width: 180,
    render: (text: string) => {
      if (!text || text === NA) return NA;
      const updatedText = text.replace(HASH_PREFIX, '0x'); // .toUpperCase();
      return <AddressLink {...addressLinkProps} text={updatedText} isIpfsLink />;
    },
  };

  if (type === NAV_TYPES.COMPONENT || type === NAV_TYPES.AGENT) {
    const dependencyColumn = {
      title: 'No. of component dependencies',
      dataIndex: 'dependency',
      width: isMobile ? 70 : 300,
      key: 'dependency',
    };

    const actionColumn = {
      width: isMobile ? 40 : 120,
      title: 'Action',
      key: 'action',
      fixed: 'right',
      render: (_text: string, record: Record) => (
        <Button size="large" type="link" onClick={() => onViewClick(record.id)}>
          View
        </Button>
      ),
    };

    const ownerColumn = {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 160,
      render: (text: string) => {
        if (!text || text === NA) return NA;
        return <AddressLink {...addressLinkProps} text={text} canCopy />;
      },
    };

    return isMainnet
      ? [tokenIdColumn, packageName, ownerColumn, hashColumn, actionColumn]
      : [tokenIdColumn, ownerColumn, dependencyColumn, actionColumn];
  }

  if (type === NAV_TYPES.SERVICE) {
    const descriptionColumn = {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 660,
      render: (text: string) => {
        if (!text || text === NA) return NA;
        return text;
      },
    };

    const servicesOfferedColumn = {
      title: 'Services Offered',
      dataIndex: 'hash',
      key: 'hash',
      width: 200,
      render: (text: string) => {
        if (!text || text === NA) return NA;
        return <AddressLink {...addressLinkProps} text={text} isIpfsLink />;
      },
    };

    const marketplaceRoleColumn = {
      title: 'Marketplace Role',
      dataIndex: 'role',
      key: 'role',
      width: 200,
      render: (_text: string, record: Record) => {
        let color = '';

        switch (record.role) {
          case 'Demand & Supply':
            color = 'purple';
            break;
          case 'Demand':
            color = 'blue';
            break;
          case 'Supply':
            color = 'red';
            break;
          case 'Registered':
            color = 'default';
            break;
          default:
            color = 'default';
            break;
        }

        return (
          <Tag color={color} bordered={false}>
            {record.role}
          </Tag>
        );
      },
    };

    const actionAndUpdateColumn = {
      width: isMobile ? 40 : 200,
      title: 'Marketplace Activity',
      dataIndex: 'role',
      key: 'role',
      align: 'center',
      render: (_text: string, record: Record) => {
        // only show update button for pre-registration state and
        // if the owner is the same as the current account
        // const canUpdate =
        //   record.state === SERVICE_STATE_KEY_MAP.preRegistration &&
        //   areAddressesEqual(record.owner, account);

        const shouldNotShowViewButton = record.role === 'Registered';

        return (
          <>
          {shouldNotShowViewButton ? null : (
            <Button onClick={() => onViewClick(record.id)}>
              View
            </Button>
          )}
          </>
          // <Space size="middle">
          //   <Button onClick={() => onViewClick(record.id)} disabled={record.owner === NA}>
          //     View
          //   </Button>

          //   {canUpdate && onUpdateClick && (
          //     <Button size="large" type="link" onClick={() => onUpdateClick(record.id)}>
          //       Update
          //     </Button>
          //   )}
          // </Space>
        );
      },
    };

    const idColumn = {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: isMobile ? 30 : 60,
    };

    return isMainnet
      ? [
          tokenIdColumn,
          descriptionColumn,
          servicesOfferedColumn,
          marketplaceRoleColumn,
          actionAndUpdateColumn,
        ]
      : [
          idColumn,
          descriptionColumn,
          servicesOfferedColumn,
          marketplaceRoleColumn,
          actionAndUpdateColumn,
        ];
  }

  return [];
};

export const convertTableRawData = (
  type: (typeof NAV_TYPES)[keyof typeof NAV_TYPES],
  rawData: Record[],
  { currentPage, isMainnet }: { currentPage: number; isMainnet: boolean },
) => {
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
  const startIndex = (currentPage - 1) * TOTAL_VIEW_COUNT + 1;

  // for mainnet
  if (isMainnet) {
    if (type === NAV_TYPES.COMPONENT || type === NAV_TYPES.AGENT) {
      return rawData.map((item) => ({
        id: item.tokenId,
        tokenId: item.tokenId,
        owner: item.owner,
        hash: item.metadataHash,
        packageName: item.publicId,
        packageHash: item.packageHash,
      }));
    }

    if (type === NAV_TYPES.SERVICE) {
      return rawData.map((item) => ({
        id: item.serviceId,
        description: item.description,
        role: item.role,
        tokenId: item.serviceId,
        hash: item.metadata || item.configHash,
        packageName: item.publicId,
        packageHash: item.packageHash,
        state: item.state,
      }));
    }
  }

  // non-mainnet chain
  if (type === NAV_TYPES.COMPONENT) {
    return rawData.map((item, index) => ({
      id: item.id || `${startIndex + index}`,
      description: item.description || NA,
      developer: item.developer || NA,
      owner: item.owner || NA,
      hash: item.unitHash || NA,
      dependency: (item.dependencies || []).length,
    }));
  }

  if (type === NAV_TYPES.AGENT) {
    return rawData.map((item, index) => ({
      id: item.id || `${startIndex + index}`,
      description: item.description || NA,
      developer: item.developer || NA,
      owner: item.owner || NA,
      hash: item.unitHash || NA,
      dependency: (item.dependencies || []).length,
    }));
  }

  if (type === NAV_TYPES.SERVICE) {
    return rawData.map((item, index) => ({
      id: item.id || `${startIndex + index}`,
      developer: item.developer || NA,
      owner: item.owner || NA,
      active: `${item.active}`,
      state: item.state,
      hash: item.metadata || item.configHash,
      description: item.description,
      role: item.role,
    }));
  }

  throw new Error('Invalid type parameter');
};

/**
 * my-components/my-agents/my-services has "my" in common hence returns
 */
export const isMyTab = (router: NextRouter) => router?.query?.tab?.includes('my-');
