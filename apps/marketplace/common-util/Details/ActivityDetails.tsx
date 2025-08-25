import type { Activity } from 'common-util/graphql/service-activity';
import { Col, Flex, Modal, Row, Typography } from 'antd';
import { AddressLink, NA } from '@autonolas/frontend-library';
import { DetailsDivider, Info } from './styles';
import { marketplaceRoleTag } from 'common-util/List/ListTable/helpers';
import { Copy } from 'components/Copy';
import { truncateAddress } from 'libs/util-functions/src';

const { Text, Title } = Typography;

type AddressLinkProps = {
  chainId?: number;
  suffixCount?: number;
};

type ActivityDetailsProps = {
  open: boolean;
  onCancel: () => void;
  activity: Activity | null;
  addressLinkProps: AddressLinkProps;
};

const timeOptions: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZone: 'UTC',
  timeZoneName: 'short',
};
const dateOptions: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
};

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return NA;
  const date = new Date(Number(timestamp) * 1000);
  const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
  const formattedDate = date.toLocaleDateString('en-US', dateOptions);

  return `${formattedTime} • ${formattedDate}`;
};

export const ActivityDetails = ({
  open,
  onCancel,
  activity,
  addressLinkProps,
}: ActivityDetailsProps) => (
  <Modal
    open={open}
    title="Activity Details"
    onCancel={onCancel}
    footer={null}
    styles={{
      content: {
        padding: 32,
      },
    }}
  >
    {activity ? (
      <Info>
        <Title level={5}>Request</Title>

        <DetailsDivider />

        <Row>
          <Col span={8}>
            <Text type="secondary">Request ID:</Text>{' '}
          </Col>
          <Col span={16}>
            {activity.requestId ? (
              <Flex align="center" justify="space-between">
                <Text>{truncateAddress(activity.requestId)}</Text>
                <Copy text={activity.requestId} />
              </Flex>
            ) : (
              NA
            )}
          </Col>
        </Row>

        <Row>
          <Col span={8}>
            <Text type="secondary">Activity Type:</Text>{' '}
          </Col>
          <Col span={16}>
            <span>{marketplaceRoleTag('', activity)}</span>
          </Col>
        </Row>

        <Row>
          <Col span={8}>
            <Text type="secondary">Requested At:</Text>{' '}
          </Col>
          <Col span={16}>
            <span>{formatTimestamp(activity.requestBlockTimestamp)}</span>
          </Col>
        </Row>

        <Row>
          <Col span={8}>
            <Text type="secondary">Request Data:</Text>{' '}
          </Col>
          <Col span={16}>
            {activity.requestIpfsHash ? (
              <Flex align="center" justify="space-between">
                <>
                  <AddressLink {...addressLinkProps} text={activity.requestIpfsHash} isIpfsLink />
                </>
                <Copy text={activity.requestIpfsHash} />
              </Flex>
            ) : (
              NA
            )}
          </Col>
        </Row>

        <Row>
          <Col span={8}>
            <Text type="secondary">Requested By:</Text>{' '}
          </Col>
          <Col span={16}>
            {activity.requestedBy ? (
              <Flex align="center" justify="space-between">
                <AddressLink {...addressLinkProps} text={activity.requestedBy} />
                <Copy text={activity.requestedBy} />
              </Flex>
            ) : (
              NA
            )}
          </Col>
        </Row>

        <Row>
          <Col span={8}>
            <Text type="secondary">Request Tx Hash:</Text>{' '}
          </Col>
          <Col span={16}>
            {activity.requestTransactionHash ? (
              <Flex align="center" justify="space-between">
                <AddressLink {...addressLinkProps} text={activity.requestTransactionHash} />
                <Copy text={activity.requestTransactionHash} />
              </Flex>
            ) : (
              NA
            )}
          </Col>
        </Row>

        <Typography.Title level={5} style={{ marginTop: 16 }}>
          Delivery
        </Typography.Title>

        <DetailsDivider />

        <Row>
          <Col span={8}>
            <Text type="secondary">Delivered At:</Text>{' '}
          </Col>
          <Col span={16}>
            <span className="info-text">{formatTimestamp(activity.deliveryBlockTimestamp)}</span>
          </Col>
        </Row>

        <Row>
          <Col span={8}>
            <Text type="secondary">Delivery Data:</Text>{' '}
          </Col>
          <Col span={16}>
            {activity.deliveryIpfsHash ? (
              <Flex align="center" justify="space-between">
                <AddressLink {...addressLinkProps} text={activity.deliveryIpfsHash} isIpfsLink />
                <Copy text={activity.deliveryIpfsHash} />
              </Flex>
            ) : (
              NA
            )}
          </Col>
        </Row>

        <Row>
          <Col span={8}>
            <Text type="secondary">Delivered By:</Text>{' '}
          </Col>
          <Col span={16}>
            {activity.deliveredBy ? (
              <Flex align="center" justify="space-between">
                <AddressLink {...addressLinkProps} text={activity.deliveredBy} />
                <Copy text={activity.deliveredBy} />
              </Flex>
            ) : (
              NA
            )}
          </Col>
        </Row>

        <Row>
          <Col span={8}>
            <Text type="secondary">Delivery Tx Hash:</Text>{' '}
          </Col>
          <Col span={16}>
            {activity.deliveryTransactionHash ? (
              <Flex align="center" justify="space-between">
                <AddressLink {...addressLinkProps} text={activity.deliveryTransactionHash} />
                <Copy text={activity.deliveryTransactionHash} />
              </Flex>
            ) : (
              NA
            )}
          </Col>
        </Row>
      </Info>
    ) : null}
  </Modal>
);
