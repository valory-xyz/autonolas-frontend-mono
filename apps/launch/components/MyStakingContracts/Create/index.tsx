import {
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Tag,
  Typography,
} from 'antd';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { mainnet } from 'viem/chains';
import { useAccount } from 'wagmi';

import { CHAIN_NAMES, EXPLORER_URLS, UNICODE_SYMBOLS } from 'libs/util-constants/src';

import {
  CONTRACT_TEMPLATES,
  IMPLEMENTATION_ADDRESSES,
  isSupportedChainId,
} from 'common-util/constants/stakingContract';
import {
  createStakingContract,
  getErrorInfo,
  getIpfsHash,
  getStakingContractInitPayload,
  notifyConnectWallet,
  notifyWrongNetwork,
} from 'common-util/functions';
import { getChainIdFromPath } from 'common-util/hooks/useNetworkHelpers';

import {
  ErrorAlert,
  ErrorType,
  FormValues,
  Hint,
  MaxNumServicesLabel,
  RewardsPerSecondLabel,
  StyledMain,
  TextWithTooltip,
  Title,
  WrongNetworkAlert,
} from './utils';

const { Paragraph, Text } = Typography;

const contractTemplate = CONTRACT_TEMPLATES[0];
const INPUT_WIDTH_STYLE = { width: '100%' };

export const CreateStakingContract = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorType>(null);
  const params = useParams<{ network: string }>();
  const chainName = params?.network as string;

  const { address: account, chain } = useAccount();

  const networkId = getChainIdFromPath(chainName);
  const wrongNetwork = chain && networkId ? networkId !== chain.id : false;

  const handleCreate = async (values: FormValues) => {
    if (!account) {
      notifyConnectWallet();
      return;
    }

    if (!chain?.id) return;

    if (!isSupportedChainId(chain?.id)) {
      throw new Error('Not supported chainId');
    }

    if (wrongNetwork) {
      notifyWrongNetwork();
      return;
    }

    setError(null);
    setIsLoading(true);

    // TODO: add validations

    const { name, description, maxNumServices, rewardsPerSecond } = values;
    try {
      const metadataHash = await getIpfsHash({ name, description });

      const initPayload = getStakingContractInitPayload({
        metadataHash,
        maxNumServices,
        rewardsPerSecond,
        chainId: chain.id,
      });

      const implementation = IMPLEMENTATION_ADDRESSES[chain.id];

      await createStakingContract({ implementation, initPayload, account });
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);

      const { message, transactionHash } = getErrorInfo(error as Error);
      setError({ message, transactionHash });
    }
  };

  return (
    <StyledMain>
      <Card>
        <Title>Create staking contract on {CHAIN_NAMES[networkId || mainnet.id]}</Title>

        {wrongNetwork && <WrongNetworkAlert networkId={networkId} />}
        {error && <ErrorAlert error={error} networkId={networkId} />}

        <Form layout="vertical" onFinish={handleCreate} requiredMark={false}>
          <Form.Item
            label={<Text type="secondary">Name</Text>}
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={<Text type="secondary">Description</Text>}
            name="description"
            className="mb-0"
            rules={[{ required: true }]}
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
          <Paragraph className="mb-8">{contractTemplate.description}</Paragraph>
          <Button
            type="link"
            className="p-0 mb-16"
            href={`${EXPLORER_URLS[networkId || mainnet.id]}/address/TBD`}
          >
            {`View template on explorer ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
          </Button>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label={<MaxNumServicesLabel />}
                name="maxNumServices"
                rules={[{ required: true }]}
              >
                <InputNumber placeholder="e.g. 6" step="1" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<RewardsPerSecondLabel />}
                name="rewardsPerSecond"
                rules={[{ required: true }]}
              >
                <InputNumber placeholder="e.g. 0.0003" step="0.0001" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
          </Row>
          <Flex justify="end" gap={12}>
            <Button>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Create contract
            </Button>
          </Flex>
        </Form>
      </Card>
    </StyledMain>
  );
};
