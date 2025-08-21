import { Divider, Modal, Typography } from 'antd';
import { AddressLink, NA } from '@autonolas/frontend-library';
import { Info } from './styles';

const { Text } = Typography;

type Activity = {
  activityType?: string;
  requestId?: string;
  requestIpfsHash?: string;
  requestBlockTimestamp?: string;
  requestedBy?: string;
  requestTransactionHash?: string;
  deliveryIpfsHash?: string;
  deliveredBy?: string;
  deliveryTransactionHash?: string;
  deliveryBlockTimestamp?: string;
};

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

const formatTimestamp = (timestamp?: string) =>
  timestamp ? new Date(Number(timestamp) * 1000).toLocaleString() : NA;

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

        <div className="grid-row">
          <Text strong>Request ID:</Text>{' '}
          {activity.requestId ? (
            <AddressLink {...addressLinkProps} text={activity.requestId} canCopy />
          ) : (
            NA
          )}
        </div>
        <div className="grid-row text-only">
          <Text strong>Activity Type:</Text> {activity.activityType}
        </div>
        <div className="grid-row text-only">
          <Text strong>Requested At:</Text> {formatTimestamp(activity.requestBlockTimestamp)}
        </div>
        <div className="grid-row">
          <Text strong>Request Data:</Text>{' '}
          {activity.requestIpfsHash ? (
            <AddressLink {...addressLinkProps} text={activity.requestIpfsHash} isIpfsLink canCopy />
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text strong>Requested By:</Text>{' '}
          {activity.requestedBy ? (
            <AddressLink {...addressLinkProps} text={activity.requestedBy} canCopy />
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text strong>Request Tx Hash:</Text>{' '}
          {activity.requestTransactionHash ? (
            <AddressLink {...addressLinkProps} text={activity.requestTransactionHash} canCopy />
          ) : (
            NA
          )}
        </div>

        <Typography.Title level={5} style={{ marginTop: 16 }}>
          Delivery
        </Typography.Title>
        <div className="grid-row text-only">
          <Text strong>Delivered At:</Text> {formatTimestamp(activity.deliveryBlockTimestamp)}
        </div>
        <div className="grid-row">
          <Text strong>Delivery Data:</Text>{' '}
          {activity.deliveryIpfsHash ? (
            <AddressLink
              {...addressLinkProps}
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
            <AddressLink {...addressLinkProps} text={activity.deliveredBy} canCopy />
          ) : (
            NA
          )}
        </div>
        <div className="grid-row">
          <Text strong>Delivery Tx Hash:</Text>{' '}
          {activity.deliveryTransactionHash ? (
            <AddressLink {...addressLinkProps} text={activity.deliveryTransactionHash} canCopy />
          ) : (
            NA
          )}
        </div>
      </Info>
    ) : null}
  </Modal>
);

export default ActivityDetails;
