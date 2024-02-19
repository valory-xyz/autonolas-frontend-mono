import styled from 'styled-components';
import {
  Row, Col, Card, Button, Typography,
} from 'antd';
import PropTypes from 'prop-types';
import {
  PlayCircleOutlined, BulbFilled, RobotOutlined,
} from '@ant-design/icons';
import Image from 'next/image';

import { COLOR } from '@autonolas/frontend-library';
import agents from './data.json';

const StyledCard = styled(Card)`
  border-color: ${COLOR.BORDER_GREY};
  width: 100%;
  .ant-card-body {
    padding: 0;
  }
`;

const CardBody = styled.div`
  padding: 16px;
`;

const StyledImage = styled(Image)`
  border-bottom: 1px solid ${COLOR.BORDER_GREY};
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  display: block;
  object-fit: cover;
`;

const StyledAddImage = styled(StyledImage)`
  border-top-right-radius: 0px;
  border-bottom-left-radius: 5px;
  border-bottom: 0;
  border-right: 1px solid ${COLOR.BORDER_GREY};
`;

const AgentCard = ({ agent }) => {
  const {
    id, name, description, imageFilename, urls, comingSoon,
  } = agent;

  const { run, learnMore, gpt } = urls;

  return (
    <Col xs={24} sm={18} md={12} key={id} style={{ margin: '0 auto' }}>
      <StyledCard>
        <StyledImage alt={name} src={`/images/${imageFilename}`} layout="responsive" width={400} height={400} />
        <CardBody>
          <Typography.Title className="mt-0" level={4}>{name}</Typography.Title>
          <div className="mb-12">
            <Typography.Paragraph ellipsis={{ rows: 3, expandable: true }}>
              {description}
            </Typography.Paragraph>
          </div>
          {comingSoon ? (
            <Button block disabled>Coming soon</Button>
          ) : (
            <>
              {run && (
              <Button type="primary" size="large" block icon={<PlayCircleOutlined />} href={run} target="_blank" className="mb-8">
                Run Agent
              </Button>
              )}
              <br />
              {learnMore && (
                <Button
                  type="default"
                  block
                  href={learnMore}
                  target="_blank"
                  style={{ marginRight: '8px' }}
                  className="mb-8"
                >
                  Learn More
                </Button>
              )}
              {gpt && (
                <Button type="default" block icon={<RobotOutlined />} href={gpt} target="_blank">
                  GPT Guide
                </Button>
              )}
            </>
          )}

        </CardBody>
      </StyledCard>
    </Col>
  );
};

AgentCard.propTypes = {
  agent: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    imageFilename: PropTypes.string.isRequired,
    urls: PropTypes.shape({
      run: PropTypes.string,
      learnMore: PropTypes.string,
      gpt: PropTypes.string,
    }),
    comingSoon: PropTypes.bool,
  }),
};

AgentCard.defaultProps = {
  agent: {
    urls: {
      run: '',
      learnMore: '',
      gpt: '',
    },
    comingSoon: false,
  },
};

export const Agents = () => (
  <Row gutter={[24, 24]} className="mb-128">
    {agents.map((agent) => (
      <AgentCard
        key={agent.id}
        agent={agent}
      />
    ))}
    {/* TODO DRY with AgentCard code */}
    <Col sm={24} lg={24} style={{ width: '100%' }}>
      <StyledCard bodyStyle={{ padding: 0 }}>
        <Row>
          <Col span={7} className="p-0">
            <StyledAddImage alt="baby robot surfing a wave, having an idea" src="/images/add-your-own.png" layout="fill" objectFit="cover" />
          </Col>
          <Col span={17} className="p-16">
            <Typography.Title className="mt-0" level={4}>
              Want people to run
              {' '}
              <b>your</b>
              {' '}
              agent?
            </Typography.Title>
            <Typography.Paragraph>
              Build an autonomous service using Open Autonomy.
              {' '}
              Then, simply submit a pull request including the quickstart.
            </Typography.Paragraph>
            <Button
              type="default"
              icon={<BulbFilled />}
              href="https://github.com/valory-xyz/autonolas-operate-frontend?tab=readme-ov-file#add-your-own-agent"
              target="_blank"
              rel="noopener noreferrer"
            >
              Add your own
            </Button>
          </Col>
        </Row>
      </StyledCard>
    </Col>
  </Row>
);
