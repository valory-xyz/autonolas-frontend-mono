import { Alert, Button, Flex, Modal, Typography } from 'antd';
import { useState } from 'react';

import { SITE_URL, SUPPORT_URL } from 'util/constants';

const { Text, Paragraph } = Typography;

export const WalletUpdateRequired = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(() => true);
  const handleClose = () => setIsOpen(() => false);

  return (
    <>
      <Alert
        type="warning"
        showIcon
        message={
          <Flex vertical gap={16} align="start">
            <Text className="font-weight-600">User wallet update required</Text>
            <Paragraph className="mb-0">
              Your current wallet address is already bonded to the Alpha staking contract and cannot
              be used for staking on the new Beta contracts.
            </Paragraph>
            <Paragraph className="mb-8">
              To continue, you’ll need to link your X account to a new wallet address.
            </Paragraph>
            <Button size="small" className="mb-4" onClick={handleOpen}>
              How to link a new wallet address
            </Button>
          </Flex>
        }
      />
      {isOpen && (
        <Modal
          open={isOpen}
          title="How to link a new wallet address"
          onCancel={handleClose}
          footer={[
            <Button key="close" onClick={handleClose} type="primary">
              Close
            </Button>,
          ]}
        >
          <ol className="mb-24">
            <li className="mb-8">
              Open another browser tab with Olas Contribute on the{' '}
              <a href={`${SITE_URL}/leaderboard`} target="_blank" rel="noopener noreferrer">
                Leaderboard page.
              </a>
            </li>
            <li className="mb-8">Disconnect your current wallet and connect a new one.</li>
            <li className="mb-8">
              Find the <span className="font-weight-600">“Connect X” section</span> at the top of
              the Leaderboard page and click on the{' '}
              <span className="font-weight-600">“Connect X” button.</span>
            </li>
            <li className="mb-8">Follow the instructions in the opened modal window.</li>

            <li className="mb-8">
              Once finished, return to the{' '}
              <span className="font-weight-600">“Contribute Staking” page</span> and proceed with
              staking setup as usual.
            </li>
          </ol>
          <Paragraph>
            If you run into any issues, join the{' '}
            <a target="_blank" rel="noopener noreferrer" href={SUPPORT_URL}>
              Olas community Discord server&nbsp;↗
            </a>{' '}
            for support.
          </Paragraph>
        </Modal>
      )}
    </>
  );
};
