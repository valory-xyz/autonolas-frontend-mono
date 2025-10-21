import { Button, Col, Flex, Row, Tabs } from 'antd';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import get from 'lodash/get';
import { FC, useCallback, useState, useEffect, useMemo } from 'react';
import { Address } from 'viem';
import { useRouter } from 'next/router';

import { GenericObject, NA } from '@autonolas/frontend-library';
import { AddressLink } from 'libs/ui-components/src';

import { getServiceActivityFromSubgraph } from 'common-util/subgraphs';
import type { Activity } from 'common-util/graphql/service-activity';
import { marketplaceRoleTag } from 'common-util/List/ListTable/helpers';
import { NAV_TYPES, NavTypesValues, TOTAL_VIEW_COUNT } from 'util/constants';

import { IpfsHashGenerationModal } from '../List/IpfsHashGenerationModal';
import { useHelpers } from '../hooks';
import { DetailsSubInfo } from './DetailsSubInfo';
import { DetailsTable, DetailsTitle, Header } from './styles';
import { ActivityDetails } from './ActivityDetails';
import { useDetails } from './useDetails';
import { useMetadata } from '../hooks/useMetadata';
import { isMarketplaceSupportedNetwork } from 'common-util/functions';
import { NftImage } from './NFTImage';

const getColumns = ({
  addressLinkProps,
  openActivityModal,
}: {
  addressLinkProps: {
    chainId: number | undefined;
  };
  openActivityModal: (record: Activity) => void;
}): ColumnsType<Activity> => {
  return [
    {
      title: 'Request ID',
      dataIndex: 'requestId',
      key: 'requestId',
      render: (text: string, record: Activity) =>
        text ? (
          <Button
            type="link"
            onClick={() => openActivityModal(record)}
            style={{ display: 'flex', gap: 8 }}
          >
            <AddressLink address={text} canNotClick canCopy />
          </Button>
        ) : (
          NA
        ),
    },
    {
      title: 'Activity type',
      dataIndex: 'activityType',
      key: 'activityType',
      align: 'center',
      render: marketplaceRoleTag,
    },
    {
      title: 'Request Data',
      dataIndex: 'requestIpfsHash',
      key: 'requestIpfsHash',
      render: (text: string) =>
        text ? (
          <Flex align="center" gap={8}>
            <AddressLink {...addressLinkProps} address={text} isIpfs />
          </Flex>
        ) : (
          NA
        ),
    },
    {
      title: 'Delivery Data',
      dataIndex: 'deliveryIpfsHash',
      key: 'deliveryIpfsHash',
      render: (text: string) =>
        text ? (
          <Flex align="center" gap={8}>
            <AddressLink {...addressLinkProps} address={text} isIpfs />
          </Flex>
        ) : (
          NA
        ),
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      render: (text: string) => (text ? <AddressLink {...addressLinkProps} address={text} /> : NA),
    },
    {
      title: 'Delivered By',
      dataIndex: 'deliveredBy',
      key: 'deliveredBy',
      render: (text: string) => (text ? <AddressLink {...addressLinkProps} address={text} /> : NA),
    },
  ];
};

type DetailsProps = {
  id: string;
  type: NavTypesValues;
  getDetails: (id: string) => Promise<{ unitHash: Address; dependencies: string[] }>;
  getTokenUri: (id: string) => Promise<string>;
  getOwner: (id: string) => Promise<string>;
  handleUpdate?: () => void;
  handleHashUpdate?: () => void;
  navigateToDependency?: (id: string, type: NavTypesValues) => void;
  renderServiceState?: (props: {
    isOwner: boolean;
    details: GenericObject;
    updateDetails: (details: GenericObject) => void;
  }) => JSX.Element | null;
};

type CurrentTab = 'details' | 'activity' | null;

export const Details: FC<DetailsProps> = ({
  id,
  type,
  getDetails,
  getTokenUri,
  getOwner,
  handleUpdate,
  handleHashUpdate,
  navigateToDependency,
  renderServiceState,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();

  const { chainName, chainId } = useHelpers();
  const { isOwner, info, ownerAddress, tokenUri, updateDetails } = useDetails({
    id,
    type,
    getDetails,
    getOwner,
    getTokenUri,
  });

  const { nftImageUrl } = useMetadata(tokenUri);

  const [currentTab, setCurrentTab] = useState<CurrentTab>(null);
  const [activityRows, setActivityRows] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const paginatedActivityRows = useMemo(() => {
    const start = (activityPage - 1) * TOTAL_VIEW_COUNT;
    const end = start + TOTAL_VIEW_COUNT;
    return activityRows.slice(start, end);
  }, [activityRows, activityPage]);

  const addressLinkProps = useMemo(() => {
    return {
      chainId: chainId ?? undefined,
    };
  }, [chainId]);

  const openActivityModal = (record: Activity) => {
    setSelectedActivity(record);
    setIsActivityModalVisible(true);
  };

  const closeActivityModal = () => {
    setIsActivityModalVisible(false);
    setSelectedActivity(null);
  };

  // Handle URL query parameter for activity tab
  useEffect(() => {
    const { activity } = router.query;
    if (activity === 'true') {
      setCurrentTab('activity');
    } else {
      setCurrentTab('details');
    }
  }, [router.query]);

  // Handle tab change
  const handleTabChange = (activeKey: string) => {
    setCurrentTab(activeKey as CurrentTab);

    // Update URL to reflect the current tab
    if (activeKey === 'activity') {
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, activity: 'true' },
        },
        undefined,
        { shallow: true },
      );
    } else {
      const { activity, ...query } = router.query;
      router.push(
        {
          pathname: router.pathname,
          query,
        },
        undefined,
        { shallow: true },
      );
    }
  };

  useEffect(() => {
    if (!isMarketplaceSupportedNetwork(Number(chainId))) return;

    const fetchActivity = async () => {
      try {
        setActivityLoading(true);
        const { latest = '' } = router.query as { latest: string };
        const json = await getServiceActivityFromSubgraph({
          chainId: Number(chainId),
          serviceId: id,
          latest,
        });

        setActivityRows(json.activities || []);
        setActivityPage(1);
      } catch (e) {
        setActivityRows([]);
      } finally {
        setActivityLoading(false);
      }
    };

    if (id) {
      fetchActivity();
    }
  }, [currentTab, id, chainName, chainId, router.query]);

  // Update button to be show only if the connected account is the owner
  // and only for services
  const canShowUpdateBtn = isOwner && type === NAV_TYPES.AI_AGENTS && !!handleUpdate;

  const openUpdateHashModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const showTabs = isMarketplaceSupportedNetwork(Number(chainId)) && activityRows.length > 0;

  return (
    <>
      <Header>
        <DetailsTitle level={2}>{`ID ${id}`}</DetailsTitle>

        <div className="right-content">
          {canShowUpdateBtn && (
            <Button
              size="large"
              type="primary"
              ghost
              onClick={handleUpdate}
              data-testid="service-update-button"
            >
              Update
            </Button>
          )}
        </div>
      </Header>

      {showTabs && (
        <Tabs
          className="registry-tabs"
          type="card"
          activeKey={currentTab ?? undefined}
          onChange={handleTabChange}
          style={{ marginTop: '24px' }}
          items={[
            {
              key: 'details',
              label: 'Agent Details',
            },
            {
              key: 'activity',
              label: 'Marketplace Activity',
            },
          ]}
        />
      )}

      {currentTab === 'activity' && (
        <div style={{ marginTop: showTabs ? 0 : 16 }}>
          <DetailsTable
            columns={getColumns({ addressLinkProps, openActivityModal }) as ColumnType<object>[]}
            dataSource={paginatedActivityRows}
            loading={activityLoading}
            pagination={{
              total: activityRows.length,
              current: activityPage,
              defaultPageSize: TOTAL_VIEW_COUNT,
              showSizeChanger: false,
              onChange: (p) => setActivityPage(p),
            }}
            rowKey="requestId"
            data-testid="activity-table"
          />

          <ActivityDetails
            open={isActivityModalVisible}
            onCancel={closeActivityModal}
            activity={selectedActivity}
            addressLinkProps={{ chainId: chainId ?? undefined, suffixCount: 6 }}
          />
        </div>
      )}

      {currentTab === 'details' ? (
        <Row>
          <Col md={12} xs={24}>
            <DetailsSubInfo
              id={id}
              isOwner={isOwner}
              type={type}
              tokenUri={tokenUri}
              ownerAddress={ownerAddress || NA}
              componentAndAgentDependencies={get(info, 'dependencies')}
              serviceThreshold={get(info, 'threshold') || NA}
              serviceCurrentState={get(info, 'state') || NA}
              handleHashUpdate={handleHashUpdate}
              openUpdateHashModal={openUpdateHashModal}
              navigateToDependency={navigateToDependency}
            />
          </Col>

          <Col md={12} xs={24}>
            {type === NAV_TYPES.AI_AGENTS ? (
              <>
                {renderServiceState
                  ? renderServiceState({ isOwner, details: info, updateDetails })
                  : null}
              </>
            ) : (
              // NftImage for "ai-agents" is shown in `DetailsSubInfo` component
              // in the left column & for "agent-blueprints" and "component" is shown here
              <NftImage imageUrl={nftImageUrl} />
            )}
          </Col>
        </Row>
      ) : null}

      {isModalVisible && (
        <IpfsHashGenerationModal
          visible={isModalVisible}
          type={type}
          handleHashUpdate={handleHashUpdate}
          handleCancel={() => setIsModalVisible(false)}
        />
      )}
    </>
  );
};

export default Details;
