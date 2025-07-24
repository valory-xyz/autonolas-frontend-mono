import { Alert, Button, Modal, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { COLOR } from '@autonolas/frontend-library';

const { Text, Paragraph } = Typography;

const NumberedList = styled.ol`
  padding-left: 20px;
  font-weight: 600;
  margin-bottom: 24px;
  .ant-typography {
    font-weight: 400;
  }
`;

const HintText = styled(Text)`
  display: block;
  width: max-content;
  color: #606f85;
  margin-top: 12px;
  border-bottom: 1px dashed #606f85;
`;

const DotList = styled.ul`
  list-style-type: square;
  padding-left: 20px;
  gap: 8px;
  li {
    padding-left: 8px;
    &::marker {
      color: #b972e8;
    }
    &:not(:last-of-type) {
      margin-bottom: 8px;
    }
  }
`;

export const HowTweetsAreScoredModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  return (
    <>
      <Button type="link" onClick={handleOpen} className="p-0">
        How your posts are scored
      </Button>
      <Modal
        title="How your posts are scored"
        open={isOpen}
        onCancel={handleClose}
        width={700}
        footer={
          <Button type="primary" onClick={handleClose}>
            Close
          </Button>
        }
      >
        <Text className="block mt-24">
          When you make a post that mentions{' '}
          <a href="https://x.com/autonolas" target="_blank" rel="noopener noreferrer">
            @autonolas
          </a>{' '}
          or includes an eligible hashtag, it is assessed and awarded points according to three
          factors:
        </Text>
        <NumberedList>
          <li>
            Writing Quality
            <Paragraph>
              Assessed as LOW, AVERAGE, or HIGH. This reflects how well your post is written.
            </Paragraph>
          </li>
          <li>
            Relevance to Olas
            <Paragraph>
              Rated as LOW, AVERAGE, or HIGH. This measures how closely your post relates to Olas
              and its key topics like Blockchain, Web3, AI agents, co-own AI, and agent economies.
            </Paragraph>
          </li>
          <li>
            Engagement
            <Paragraph>
              Categorized as LOW, AVERAGE, or HIGH based on the number of impressions your post
              receives.
            </Paragraph>
          </li>
        </NumberedList>
        <Text className="font-weight-600">How points are calculated</Text>
        <DotList>
          <li>Each factor is assigned a score from 1 (LOW) to 3 (HIGH).</li>
          <li>These scores are added together for a total between 3 and 9.</li>
          <li>The total is then scaled to award you between 100 and 1000 points.</li>
        </DotList>
        <Alert
          type="info"
          showIcon
          message="Tip: Craft high-quality, relevant posts that engage your audience to earn more points!"
        />
      </Modal>
    </>
  );
};

export const TweetCountTooltip = () => (
  <Tooltip
    color={COLOR.WHITE}
    title={
      <>
        <Paragraph>
          Contribute regularly checks X in the background to capture eligible posts.
        </Paragraph>
        <Paragraph>Due to X API restrictions, some of your posts may not be counted.</Paragraph>
        <Paragraph className="mb-0">
          Please ensure your posts are public, include the required tags, and meet all eligibility
          guidelines.
        </Paragraph>
      </>
    }
  >
    <HintText>Why wasn’t my post counted?</HintText>
  </Tooltip>
);
