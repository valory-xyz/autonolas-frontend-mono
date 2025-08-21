import { useEffect, useState } from 'react';
import { Card, List, Tag, Typography, Spin, Empty } from 'antd';
import { ClockCircleOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Text, Title } = Typography;

const ActivityContainer = styled.div`
  padding: 16px;
`;

const ActivityItem = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ActivityMeta = styled.div`
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 12px;
`;

const ActivityContent = styled.div`
  margin-top: 8px;
`;

type Activity = {
  activityType: 'Demand' | 'Supply';
  requestId: string;
  requestIpfsHash: string;
  requestBlockTimestamp: string;
  requestedBy: string;
  requestTransactionHash: string;
  deliveryIpfsHash: string;
  deliveredBy: string;
  deliveryTransactionHash: string;
  deliveryBlockTimestamp: string;
};

type ServiceActivityProps = {
  serviceId: string;
  network?: string | null;
};

export const ServiceActivity: React.FC<ServiceActivityProps> = ({
  serviceId,
  network = 'gnosis',
}) => {
  // Map chain names to network identifiers used by the API
  const getNetworkIdentifier = (chainName: string | null) => {
    if (!chainName) return 'gnosis';

    switch (chainName) {
      case 'gnosis':
        return 'gnosis';
      case 'base':
        return 'base';
      default:
        return 'gnosis';
    }
  };

  const networkIdentifier = getNetworkIdentifier(network);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/service-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            network: networkIdentifier,
            serviceId,
            limitForMM: 50,
            limitForLegacy: 50,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch activity data');
        }

        const data = await response.json();
        setActivities(data.services?.activities || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activity data');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchActivities();
    }
  }, [serviceId, network, networkIdentifier]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  const getActivityIcon = (type: 'Demand' | 'Supply') => {
    return type === 'Demand' ? <FileTextOutlined /> : <UserOutlined />;
  };

  const getActivityColor = (type: 'Demand' | 'Supply') => {
    return type === 'Demand' ? 'blue' : 'green';
  };

  if (loading) {
    return (
      <ActivityContainer>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading activity data...</div>
        </div>
      </ActivityContainer>
    );
  }

  if (error) {
    return (
      <ActivityContainer>
        <Empty description="Failed to load activity data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </ActivityContainer>
    );
  }

  if (activities.length === 0) {
    return (
      <ActivityContainer>
        <Empty
          description="No activity found for this service"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </ActivityContainer>
    );
  }

  return (
    <ActivityContainer>
      <Title level={4} style={{ marginBottom: '24px' }}>
        Service Activity
      </Title>

      <List
        dataSource={activities}
        renderItem={(activity) => (
          <List.Item>
            <ActivityItem>
              <ActivityHeader>
                <Tag
                  color={getActivityColor(activity.activityType)}
                  icon={getActivityIcon(activity.activityType)}
                >
                  {activity.activityType}
                </Tag>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {formatTimestamp(activity.requestBlockTimestamp)}
                </Text>
              </ActivityHeader>

              <ActivityContent>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Request ID:</Text> {activity.requestId}
                </div>

                <ActivityMeta>
                  <span>
                    <UserOutlined style={{ marginRight: '4px' }} />
                    Requested by: {activity.requestedBy}
                  </span>
                  <span>
                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                    {formatTimestamp(activity.requestBlockTimestamp)}
                  </span>
                </ActivityMeta>

                {activity.deliveryIpfsHash && (
                  <>
                    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                      <Text strong>Delivery:</Text> {activity.deliveryIpfsHash}
                    </div>
                    <ActivityMeta>
                      <span>
                        <UserOutlined style={{ marginRight: '4px' }} />
                        Delivered by: {activity.deliveredBy}
                      </span>
                      <span>
                        <ClockCircleOutlined style={{ marginRight: '4px' }} />
                        {formatTimestamp(activity.deliveryBlockTimestamp)}
                      </span>
                    </ActivityMeta>
                  </>
                )}
              </ActivityContent>
            </ActivityItem>
          </List.Item>
        )}
      />
    </ActivityContainer>
  );
};
