import { Alert, Flex, Typography } from 'antd';

import { formatDate } from 'common-util/functions/time';
import { GOVERN_APP_URL } from 'util/constants';

const { Text, Paragraph } = Typography;

export const RecovererAlert = ({
  isNew,
  unstakeTimestamp,
}: {
  isNew: boolean;
  unstakeTimestamp: number | null;
}) => {
  return (
    <Alert
      type="warning"
      showIcon
      message={
        <Flex vertical gap={8}>
          <Text className="font-weight-600">
            Alpha staking contracts replaced by Beta contracts!
          </Text>
          <Paragraph className="mb-4">
            Your {isNew ? 'old' : 'current'} staking contract contains a bug that may prevent you
            from fully withdrawing OLAS staked using Contribute (contribute.olas.network). A DAO
            proposal has been created to enable users to recover their bonds from these Alpha
            staking contracts.
          </Paragraph>
          <Text>Intended flow:</Text>
          <ol className="mt-0 mb-4">
            <li className="font-weight-600 mb-8">
              Wait for the proposal (“Fund Contribute Manag...”) to be executed.
              <Text className="block font-weight-400">
                You can track its progress using the link below.
              </Text>
            </li>
            <li className="font-weight-600 mb-8">
              Once the proposal is executed, if you want to withdraw your OLAS, you can learn about
              <br />
              one way to do so in the PDF.
            </li>
          </ol>
          {typeof unstakeTimestamp === 'number' && unstakeTimestamp > 0 && (
            <Paragraph>
              <span className="font-weight-600">Note:</span> if you have recently staked, you may
              not be able to begin the withdrawal process yet, as you need to remain staked for a
              certain period.
              <br />
              You can start withdrawing no earlier than:{' '}
              <span className="font-weight-600">{formatDate(unstakeTimestamp * 1000)}</span>
            </Paragraph>
          )}
          <a
            href={`${GOVERN_APP_URL}/proposals?proposalId=36031414401270968281819940673886809451115732209347053152611693625665455429080`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4"
          >
            Track DAO proposal status&nbsp;↗
          </a>
          <a
            href="/documents/How Contributors Can Recover Their Bond and Premiums.pdf?v=2"
            target="_blank"
            rel="noopener noreferrer"
          >
            PDF describing one way to recover bonds from Contribute Staking Contracts&nbsp;↗
          </a>
        </Flex>
      }
    />
  );
};
