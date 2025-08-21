import { Button, Col, Row, Tabs, Typography, Table } from 'antd';
import capitalize from 'lodash/capitalize';
import get from 'lodash/get';
import { FC, useCallback, useState, useEffect, useMemo } from 'react';
import { Address } from 'viem';
import { useRouter } from 'next/router';

import { AddressLink, GenericObject, Loader, NA } from '@autonolas/frontend-library';

import { HASH_PREFIX, NAV_TYPES, NavTypesValues, TOTAL_VIEW_COUNT } from 'util/constants';

import { IpfsHashGenerationModal } from '../List/IpfsHashGenerationModal';
import { useHelpers } from '../hooks';
import { useMetadata } from '../hooks/useMetadata';
import { DetailsSubInfo } from './DetailsSubInfo';
import { DetailsTitle, Header } from './styles';
import { ActivityDetails } from './ActivityDetails';
import { useDetails } from './useDetails';

const { Text } = Typography;

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

  const { isMainnet, chainName, chainId } = useHelpers();
  const { isLoading, isOwner, info, ownerAddress, tokenUri, updateDetails } = useDetails({
    id,
    type,
    getDetails,
    getOwner,
    getTokenUri,
  });
  const { nftImageUrl, packageName } = useMetadata(tokenUri);

  const [currentTab, setCurrentTab] = useState('details');
  const [activityRows, setActivityRows] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  const paginatedActivityRows = useMemo(() => {
    const start = (activityPage - 1) * TOTAL_VIEW_COUNT;
    const end = start + TOTAL_VIEW_COUNT;
    return activityRows.slice(start, end);
  }, [activityRows, activityPage]);

  const addressLinkProps = {
    chainId,
    suffixCount: 6,
  };

  const openActivityModal = (record: any) => {
    setSelectedActivity(record);
    setIsActivityModalVisible(true);
  };

  const closeActivityModal = () => {
    setIsActivityModalVisible(false);
    setSelectedActivity(null);
  };

  const formatTimestamp = (timestamp?: string) =>
    timestamp ? new Date(Number(timestamp) * 1000).toLocaleString() : NA;

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
    setCurrentTab(activeKey);

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
        let serviceIdStr = Array.isArray(id) ? id[0] : String(id);
        const params = new URLSearchParams({
          network: mapNetwork(chainName),
          serviceId: (serviceIdStr = '2119'), //for testing
        });
        const response = await fetch(`/api/service-activity?${params.toString()}`);
        const json = await response.json();
        console.log(json);
        setActivityRows(json?.services?.activities || []);
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
  }, [currentTab, id, chainName]);

  // Update button to be show only if the connected account is the owner
  // and only for services
  const canShowUpdateBtn = isOwner && type === NAV_TYPES.SERVICE && !!handleUpdate;

  const openUpdateHashModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  if (isLoading) {
    return <Loader timeoutMessage="Details couldn’t be loaded" />;
  }

  return (
    <>
      <Header>
        <div>
          {isMainnet ? (
            <DetailsTitle level={3}>ID {id}</DetailsTitle>
          ) : (
            <>
              <Text strong>{`${capitalize(type)} Name`}</Text>
              <DetailsTitle level={2}>{`${capitalize(type)} ID ${id}`}</DetailsTitle>
            </>
          )}
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
              <Table
                columns={[
                  {
                    title: 'Request ID',
                    dataIndex: 'requestId',
                    key: 'requestId',
                    render: (text: string, record: any) =>
                      text ? (
                        <Button type="link" onClick={() => openActivityModal(record)}>
                          {<AddressLink {...addressLinkProps} text={text} cannotClick />}
                        </Button>
                      ) : null,
                  },
                  { title: 'Activity type', dataIndex: 'activityType', key: 'activityType' },
                  {
                    title: 'Request Data',
                    dataIndex: 'requestIpfsHash',
                    key: 'requestIpfsHash',
                    render: (text: string) =>
                      text ? (
                        <AddressLink {...addressLinkProps} text={text} isIpfsLink canCopy />
                      ) : null,
                  },
                  {
                    title: 'Delivery Data',
                    dataIndex: 'deliveryIpfsHash',
                    key: 'deliveryIpfsHash',
                    render: (text: string) =>
                      text ? (
                        <AddressLink {...addressLinkProps} text={text} isIpfsLink canCopy />
                      ) : null,
                  },
                  {
                    title: 'Requested By',
                    dataIndex: 'requestedBy',
                    key: 'requestedBy',
                    render: (text: string) =>
                      text ? <AddressLink {...addressLinkProps} text={text} /> : null,
                  },
                  {
                    title: 'Delivered By',
                    dataIndex: 'deliveredBy',
                    key: 'deliveredBy',
                    render: (text: string) =>
                      text ? <AddressLink {...addressLinkProps} text={text} /> : null,
                  },
                ]}
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
