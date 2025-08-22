import { Button, Col, Row, Tabs } from 'antd';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import get from 'lodash/get';
import { FC, useCallback, useState, useEffect, useMemo } from 'react';
import { Address } from 'viem';
import { useRouter } from 'next/router';

import { AddressLink, GenericObject, NA } from '@autonolas/frontend-library';

import { getServiceActivityDataFromSubgraph } from 'common-util/subgraphs';
import type { Activity } from 'common-util/apiRoute/service-activity';
import { NAV_TYPES, NavTypesValues, TOTAL_VIEW_COUNT } from 'util/constants';

import { IpfsHashGenerationModal } from '../List/IpfsHashGenerationModal';
import { useHelpers } from '../hooks';
import { DetailsSubInfo } from './DetailsSubInfo';
import { DetailsTable, DetailsTitle, Header } from './styles';
import { ActivityDetails } from './ActivityDetails';
import { useDetails } from './useDetails';
import { marketplaceRoleTag } from 'common-util/List/ListTable/helpers';
import { CopyOutlined } from '@ant-design/icons';
import { Flex } from 'antd';

export const CopyBtn = ({ text }: { text: string }) => {
  return (
    <Button
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
      }}
      icon={<CopyOutlined />}
    />
  );
};

const getColumns = ({
  addressLinkProps,
  openActivityModal,
}: {
  addressLinkProps: {
    chainId: number | undefined;
    suffixCount: number;
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
            {<AddressLink suffixCount={8} textMinWidth={160} text={text} cannotClick />}
            <CopyBtn text={text} />
          </Button>
        ) : null,
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
            <AddressLink {...addressLinkProps} textMinWidth={120} text={text} isIpfsLink />
            <CopyBtn text={text} />
          </Flex>
        ) : null,
    },
    {
      title: 'Delivery Data',
      dataIndex: 'deliveryIpfsHash',
      key: 'deliveryIpfsHash',
      render: (text: string) =>
        text ? (
          <Flex align="center" gap={8}>
            <AddressLink {...addressLinkProps} textMinWidth={120} text={text} isIpfsLink />
            <CopyBtn text={text} />
          </Flex>
        ) : null,
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      render: (text: string) => (text ? <AddressLink {...addressLinkProps} text={text} /> : null),
    },
    {
      title: 'Delivered By',
      dataIndex: 'deliveredBy',
      key: 'deliveredBy',
      render: (text: string) => (text ? <AddressLink {...addressLinkProps} text={text} /> : null),
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

type CurrentTab = 'details' | 'activity';

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

  const [currentTab, setCurrentTab] = useState<CurrentTab>('details');
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

  const addressLinkProps = {
    chainId: chainId ?? undefined,
    suffixCount: 6,
  };

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
    const mapNetwork = (name?: string | null) => {
      if (!name) return 'gnosis';
      if (name.includes('base')) return 'base';
      if (name.includes('gnosis')) return 'gnosis';
      return 'gnosis';
    };

    const fetchActivity = async () => {
      try {
        setActivityLoading(true);
        const json = await getServiceActivityDataFromSubgraph({
          network: mapNetwork(chainName),
          serviceId: id,
        });

        setActivityRows(json.activities || []);
        setActivityPage(1);
      } catch (e) {
        setActivityRows([]);
      } finally {
        setActivityLoading(false);
      }
    };

    if (currentTab === 'activity' && id) {
      fetchActivity();
    }
  }, [currentTab, id, chainName, chainId]);

  // Update button to be show only if the connected account is the owner
  // and only for services
  const canShowUpdateBtn = isOwner && type === NAV_TYPES.SERVICE && !!handleUpdate;

  const openUpdateHashModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  return (
    <>
      <Header>
        <div>
          <DetailsTitle level={2}>{`ID ${id}`}</DetailsTitle>
        </div>

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

      {(chainId == 100 || chainId == 8453) && (
        <Tabs
          className="registry-tabs"
          type="card"
          activeKey={currentTab}
          onChange={handleTabChange}
          style={{ marginTop: '24px' }}
          items={[
            {
              key: 'details',
              label: 'Details',
            },
            {
              key: 'activity',
              label: 'Activity',
              children: (
                <DetailsTable
                  columns={
                    getColumns({ addressLinkProps, openActivityModal }) as ColumnType<object>[]
                  }
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
              ),
            },
          ]}
        />
      )}

      <ActivityDetails
        open={isActivityModalVisible}
        onCancel={closeActivityModal}
        activity={selectedActivity}
        addressLinkProps={{ chainId: chainId ?? undefined, suffixCount: 6 }}
      />

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
            {type === NAV_TYPES.SERVICE ? (
              <>
                {renderServiceState
                  ? renderServiceState({ isOwner, details: info, updateDetails })
                  : null}
              </>
            ) : null}
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
