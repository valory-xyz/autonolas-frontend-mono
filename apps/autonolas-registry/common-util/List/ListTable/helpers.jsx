import { Button, Space } from 'antd';

import { AddressLink, NA, areAddressesEqual } from '@autonolas/frontend-library';
import { AddressLink as AddressLinkSimple } from 'libs/ui-components/src';

import {
  HASH_PREFIX,
  NAV_TYPES,
  SERVICE_STATE,
  SERVICE_STATE_KEY_MAP,
  TOTAL_VIEW_COUNT,
} from '../../../util/constants';

export const getTableColumns = (
  type,
  { onViewClick, onUpdateClick, isMobile, chainName, account, chainId, isMainnet },
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
    render: (text, record) => {
      if (!text || text === NA) return NA;
      return (
        <Button size="large" type="link" onClick={() => onViewClick(record.id)}>
          {text}
        </Button>
      );
    },
  };

  const ownerColumn = {
    title: 'Owner',
    dataIndex: 'owner',
    key: 'owner',
    width: 160,
    render: (text) => {
      if (!text || text === NA) return NA;
      return <AddressLink {...addressLinkProps} text={text} canCopy />;
    },
  };

  const hashColumn = {
    title: 'Hash',
    dataIndex: 'hash',
    key: 'hash',
    width: 180,
    render: (text) => {
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
      render: (_text, record) => (
        <Button size="large" type="link" onClick={() => onViewClick(record.id)}>
          View
        </Button>
      ),
    };

    return isMainnet
      ? [tokenIdColumn, packageName, ownerColumn, hashColumn, actionColumn]
      : [tokenIdColumn, ownerColumn, dependencyColumn, actionColumn];
  }

  if (type === NAV_TYPES.SERVICE) {
    const stateColumn = {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 150,
      render: (text) => {
        if (!text) return NA;
        return SERVICE_STATE[text];
      },
    };
    const actionAndUpdateColumn = {
      width: isMobile ? 40 : 200,
      title: 'Action',
      key: 'action',
      fixed: 'right',
      render: (_text, record) => {
        // only show update button for pre-registration state and
        // if the owner is the same as the current account
        const canUpdate =
          record.state === SERVICE_STATE_KEY_MAP.preRegistration &&
          areAddressesEqual(record.owner, account);

        return (
          <Space size="middle">
            <Button
              size="large"
              type="link"
              onClick={() => onViewClick(record.id)}
              disabled={record.owner === NA}
            >
              View
            </Button>

            {canUpdate && onUpdateClick && (
              <Button size="large" type="link" onClick={() => onUpdateClick(record.id)}>
                Update
              </Button>
            )}
          </Space>
        );
      },
    };

    const idColumn = {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: isMobile ? 30 : 50,
    };

    const nonMainnetOwnerColumn = {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 200,
      render: (text, record) => {
        if (!text || text === NA) return NA;
        return <AddressLinkSimple address={record.owner} chainId={chainId} />;
      },
    };

    return isMainnet
      ? [tokenIdColumn, packageName, ownerColumn, hashColumn, stateColumn, actionAndUpdateColumn]
      : [idColumn, nonMainnetOwnerColumn, stateColumn, actionAndUpdateColumn];
  }

  return [];
};

export const convertTableRawData = (type, rawData, { currentPage, isMainnet }) => {
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
        tokenId: item.serviceId,
        owner: item.owner,
        hash: item.metadataHash,
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
    }));
  }

  throw new Error('Invalid type parameter');
};

/**
 * my-components/my-agents/my-services has "my" in common hence returns
 */
export const isMyTab = (router) => router?.query?.tab?.includes('my-');
