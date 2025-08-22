import type { Activity } from 'common-util/apiRoute/service-activity';
import { Modal, Typography } from 'antd';
import { AddressLink, NA } from '@autonolas/frontend-library';
import { DetailsDivider, Info } from './styles';
import { marketplaceRoleTag } from 'common-util/List/ListTable/helpers';

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
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString();

  return `${formattedDate} • ${formattedTime}`;
};
const MIN_WIDTH = 250;

export const ActivityDetails = ({
  open,
  onCancel,
  activity,
  addressLinkProps,
}: ActivityDetailsProps) => (
  <Modal open={open} title="Activity Details" onCancel={onCancel} footer={null}>
    {activity ? (
      <Info>
        <Typography.Title level={5}>Request</Typography.Title>
        <DetailsDivider />

        <div className="grid-row">
          <Text strong>Request ID:</Text>{' '}
          {activity.requestId ? (
            <AddressLink
              {...addressLinkProps}
              textMinWidth={MIN_WIDTH}
              text={activity.requestId}
              canCopy
            />
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text strong>Activity Type:</Text>{' '}
          <span style={{ marginLeft: 15 }}>{marketplaceRoleTag('', activity)}</span>
        </div>
        <div className="grid-row text-only">
          <Text strong>Requested At:</Text>{' '}
          <span className="info-text">{formatTimestamp(activity.requestBlockTimestamp)}</span>
        </div>
        <div className="grid-row">
          <Text strong>Request Data:</Text>{' '}
          {activity.requestIpfsHash ? (
            <AddressLink
              {...addressLinkProps}
              textMinWidth={MIN_WIDTH}
              text={activity.requestIpfsHash}
              isIpfsLink
              canCopy
            />
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text strong>Requested By:</Text>{' '}
          {activity.requestedBy ? (
            <AddressLink
              {...addressLinkProps}
              textMinWidth={MIN_WIDTH}
              text={activity.requestedBy}
              canCopy
            />
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text strong>Request Tx Hash:</Text>{' '}
          {activity.requestTransactionHash ? (
            <AddressLink
              {...addressLinkProps}
              textMinWidth={MIN_WIDTH}
              text={activity.requestTransactionHash}
              canCopy
            />
          ) : (
            NA
          )}
        </div>

        <Typography.Title level={5} style={{ marginTop: 16 }}>
          Delivery
        </Typography.Title>
        <DetailsDivider />

        <div className="grid-row text-only">
          <Text strong>Delivered At:</Text>{' '}
          <span className="info-text">{formatTimestamp(activity.deliveryBlockTimestamp)}</span>
        </div>
        <div className="grid-row">
          <Text strong>Delivery Data:</Text>{' '}
          {activity.deliveryIpfsHash ? (
            <AddressLink
              {...addressLinkProps}
              textMinWidth={MIN_WIDTH}
              text={activity.deliveryIpfsHash}
              isIpfsLink
              canCopy
            />
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text strong>Delivered By:</Text>{' '}
          {activity.deliveredBy ? (
            <AddressLink
              {...addressLinkProps}
              textMinWidth={MIN_WIDTH}
              text={activity.deliveredBy}
              canCopy
            />
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text strong>Delivery Tx Hash:</Text>{' '}
          {activity.deliveryTransactionHash ? (
            <AddressLink
              {...addressLinkProps}
              textMinWidth={MIN_WIDTH}
              text={activity.deliveryTransactionHash}
              canCopy
            />
          ) : (
            NA
          )}
        </div>
      </Info>
    ) : null}
  </Modal>
);

export default ActivityDetails;
