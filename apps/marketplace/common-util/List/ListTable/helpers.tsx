import Link from 'next/link';
import styled from 'styled-components';
import type { NextRouter } from 'next/router';
import { Button, Flex, Tag } from 'antd';

import { AddressLink, NA } from '@autonolas/frontend-library';
import { truncateAddress } from 'libs/util-functions/src';
import { Activity } from 'common-util/graphql/service-activity';

import { HASH_PREFIX, NAV_TYPES, SERVICE_ROLE, TOTAL_VIEW_COUNT } from '../../../util/constants';

const TruncatedText = styled.div`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
`;

/**
 * This handles to record for these types: ai agents, agent blueprints and components
 */
type TableRecord = {
  id: string;
  role: (typeof SERVICE_ROLE)[keyof typeof SERVICE_ROLE];
  activityType: (typeof SERVICE_ROLE)[keyof typeof SERVICE_ROLE];
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

export const marketplaceRoleTag = (_text: string, record: TableRecord | Activity) => {
  let color = '';
  const marketplaceRole = 'role' in record ? record.role : record.activityType;

  switch (marketplaceRole) {
    case SERVICE_ROLE.DEMAND_AND_SUPPLY:
      color = 'purple';
      break;
    case SERVICE_ROLE.DEMAND:
      color = 'blue';
      break;
    case SERVICE_ROLE.SUPPLY:
      color = 'pink';
      break;
    case SERVICE_ROLE.REGISTERED:
      color = 'default';
      break;
    default:
      color = 'default';
      break;
  }

  return (
    <Tag color={color} bordered={false} style={{ margin: '8px 0' }}>
      {marketplaceRole}
    </Tag>
  );
};

export const getTableColumns = (
  type: (typeof NAV_TYPES)[keyof typeof NAV_TYPES],
  {
    onViewClick,
    isMobile,
    chainId,
    isMainnet,
    chainName,
    onServicesHashClick,
  }: {
    onViewClick: (id: string) => void;
    isMobile: boolean;
    chainId: number;
    isMainnet: boolean;
    chainName: string;
    onServicesHashClick: (serviceId: string) => void;
  },
) => {
  const isGnosisOrBaseNetwork = !!chainId && (chainId === 100 || chainId === 8453);

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
    render: (text: string, record: TableRecord) => {
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
      render: (_text: string, record: TableRecord) => (
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
        return <TruncatedText title={text}>{text}</TruncatedText>;
      },
    };

    const servicesOfferedColumn = {
      title: 'Services Offered',
      dataIndex: 'hash',
      key: 'hash',
      width: 200,
      render: (_text: string, record: TableRecord) => {
        return (
          <Button type="link" onClick={() => onServicesHashClick?.(record.id)}>
            {truncateAddress(record.hash)}
          </Button>
        );
      },
    };

    const marketplaceRoleColumn = {
      title: 'Marketplace Role',
      dataIndex: 'role',
      key: 'role',
      width: 200,
      render: marketplaceRoleTag,
    };

    const marketplaceActivity = {
      width: isMobile ? 40 : 200,
      title: 'Marketplace Activity',
      dataIndex: 'role',
      key: 'role',
      align: 'center',
      render: (_text: string, record: TableRecord) => {
        if (record.role === SERVICE_ROLE.REGISTERED) return null;
        return (
          <Flex justify="center">
            <Button size="small" onClick={() => onViewClick(record.id)}>
              View
            </Button>
          </Flex>
        );
      },
    };

    const idColumn = {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: isMobile ? 30 : 60,
      render: (text: string) => {
        return <Link href={`/${chainName}/ai-agents/${text}`}>{text}</Link>;
      },
    };

    return !isGnosisOrBaseNetwork
      ? [idColumn, descriptionColumn, servicesOfferedColumn, marketplaceRoleColumn]
      : [
          idColumn,
          descriptionColumn,
          servicesOfferedColumn,
          marketplaceRoleColumn,
          marketplaceActivity,
        ];
  }

  return [];
};

export const convertTableRawData = (
  type: (typeof NAV_TYPES)[keyof typeof NAV_TYPES],
  rawData: TableRecord[],
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
