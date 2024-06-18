import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Form, Input, Row, Tag, Tooltip, Typography } from 'antd';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';
import { CHAIN_NAMES, UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { CONTRACT_TEMPLATES } from 'common-util/constants/contractTemplates';
import { useAppSelector } from 'store/index';

const { Paragraph, Text } = Typography;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0 0 24px;
`;

const Hint = styled(Paragraph)`
  margin-top: 4px;
  font-size: 14px;
`;

const TextWithTooltip = ({
  text,
  description,
}: {
  text: string;
  description: string | React.ReactNode;
}) => (
  <Tooltip color={COLOR.WHITE} title={<Paragraph className="m-0">{description}</Paragraph>}>
    <Text type="secondary">
      {text} <InfoCircleOutlined className="ml-4" />
    </Text>
  </Tooltip>
);

const contractTemplate = CONTRACT_TEMPLATES[0];

export const CreateStakingContract = () => {
  const { networkId } = useAppSelector((state) => state.network);

  return (
    <StyledMain>
      <Card>
        <Title>Create staking contract {networkId && `on ${CHAIN_NAMES[networkId]}`}</Title>
        <Form layout="vertical" onFinish={() => {}}>
          <Form.Item label={<Text type="secondary">Name</Text>} name="name">
            <Input />
          </Form.Item>
          <Form.Item
            label={<Text type="secondary">Description</Text>}
            name="description"
            className="mb-0"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Hint type="secondary">
            Good descriptions help governors understand the value your contract brings to the
            ecosystem. Be clear to increase the chance governors allocate rewards to your contract.
          </Hint>
          <Divider />
          <TextWithTooltip
            text="Template"
            description="Template contracts must be approved by DAO vote"
          />
          <Flex className="mt-4 mb-8" gap={16}>
            <Text>{contractTemplate.title}</Text>
            <Tag color="default">More templates coming soon</Tag>
          </Flex>
          <Paragraph className="mb-24">{contractTemplate.description}</Paragraph>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label={
                  <TextWithTooltip
                    text="Maximum number of staked agents"
                    description={
                      <>
                        How many agents do you need running? Agents can be sovereign or
                        decentralized agents. They join the contract on a first come, first serve
                        basis.
                        <br />
                        <a href="https://olas.network/learn" target="_blank">
                          Learn more {UNICODE_SYMBOLS.EXTERNAL_LINK}
                        </a>
                      </>
                    }
                  />
                }
                name="name"
              >
                <Input placeholder="e.g. 6" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <TextWithTooltip
                    text="Rewards, OLAS per second"
                    description="Token rewards come from the Olas protocol"
                  />
                }
                name="name"
              >
                <Input placeholder="e.g. 0.0003" />
              </Form.Item>
            </Col>
          </Row>
          <Flex justify="end" gap={12}>
            <Button>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Create contract
            </Button>
          </Flex>
        </Form>
      </Card>
    </StyledMain>
  );
};
