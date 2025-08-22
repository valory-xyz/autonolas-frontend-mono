import type { Activity } from 'common-util/graphql/service-activity';
import { Flex, Modal, Typography } from 'antd';
import { AddressLink, NA } from '@autonolas/frontend-library';
import { DetailsDivider, Info } from './styles';
import { marketplaceRoleTag } from 'common-util/List/ListTable/helpers';
import { CopyBtn } from '.';
import { truncateAddress } from 'libs/util-functions/src';

const { Text } = Typography;

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

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return NA;
  const date = new Date(Number(timestamp) * 1000);
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'UTC',
    timeZoneName: 'short',
  };
  const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  };
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
        <Typography.Title level={5}>Request</Typography.Title>

        <DetailsDivider />

        <div className="grid-row text-only">
          <Text type="secondary">Request ID:</Text>{' '}
          {activity.requestId ? (
            <Flex align="center" justify="space-between">
              <Text>{truncateAddress(activity.requestId)}</Text>
              <CopyBtn text={activity.requestId} />
            </Flex>
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text type="secondary">Activity Type:</Text>{' '}
          <span>{marketplaceRoleTag('', activity)}</span>
        </div>
        <div className="grid-row text-only">
          <Text type="secondary">Requested At:</Text>{' '}
          <span className="info-text">{formatTimestamp(activity.requestBlockTimestamp)}</span>
        </div>
        <div className="grid-row">
          <Text type="secondary">Request Data:</Text>{' '}
          {activity.requestIpfsHash ? (
            <Flex align="center" justify="space-between">
              <>
                <AddressLink {...addressLinkProps} text={activity.requestIpfsHash} isIpfsLink />
              </>
              <CopyBtn text={activity.requestIpfsHash} />
            </Flex>
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text type="secondary">Requested By:</Text>{' '}
          {activity.requestedBy ? (
            <Flex align="center" justify="space-between">
              <AddressLink {...addressLinkProps} text={activity.requestedBy} />
              <CopyBtn text={activity.requestedBy} />
            </Flex>
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text type="secondary">Request Tx Hash:</Text>{' '}
          {activity.requestTransactionHash ? (
            <Flex align="center" justify="space-between">
              <AddressLink {...addressLinkProps} text={activity.requestTransactionHash} />
              <CopyBtn text={activity.requestTransactionHash} />
            </Flex>
          ) : (
            NA
          )}
        </div>

        <Typography.Title level={5} style={{ marginTop: 16 }}>
          Delivery
        </Typography.Title>

        <DetailsDivider />

        <div className="grid-row text-only">
          <Text type="secondary">Delivered At:</Text>{' '}
          <span className="info-text">{formatTimestamp(activity.deliveryBlockTimestamp)}</span>
        </div>
        <div className="grid-row">
          <Text type="secondary">Delivery Data:</Text>{' '}
          {activity.deliveryIpfsHash ? (
            <Flex align="center" justify="space-between">
              <AddressLink {...addressLinkProps} text={activity.deliveryIpfsHash} isIpfsLink />
              <CopyBtn text={activity.deliveryIpfsHash} />
            </Flex>
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text type="secondary">Delivered By:</Text>{' '}
          {activity.deliveredBy ? (
            <Flex align="center" justify="space-between">
              <AddressLink {...addressLinkProps} text={activity.deliveredBy} />
              <CopyBtn text={activity.deliveredBy} />
            </Flex>
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text type="secondary">Delivery Tx Hash:</Text>{' '}
          {activity.deliveryTransactionHash ? (
            <Flex align="center" justify="space-between">
              <AddressLink {...addressLinkProps} text={activity.deliveryTransactionHash} />
              <CopyBtn text={activity.deliveryTransactionHash} />
            </Flex>
          ) : (
            NA
          )}
        </div>
      </Info>
    ) : null}
  </Modal>
);

export default ActivityDetails;
