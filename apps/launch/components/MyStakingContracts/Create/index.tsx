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
import { ContractTransactionReceipt, TransactionResponse } from 'ethers';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { mainnet } from 'viem/chains';
import { useAccount } from 'wagmi';

import { CHAIN_NAMES, EXPLORER_URLS, UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { ErrorAlert } from 'common-util/ErrorAlert';
import {
  CONTRACT_TEMPLATES,
  IMPLEMENTATION_ADDRESSES,
  isSupportedChainId,
} from 'common-util/constants/stakingContract';
import { URL } from 'common-util/constants/urls';
import {
  Feature,
  createStakingContract,
  getErrorInfo,
  getIpfsHash,
  getStakingContractInitPayload,
  notifyConnectWallet,
  notifyWrongNetwork,
} from 'common-util/functions';
import { getChainIdFromPath } from 'common-util/functions/networkHelpers';
import { useAppDispatch } from 'store/index';
import { addStakingContract } from 'store/launch';
import { ErrorType } from 'types/index';

import { Hint, StyledMain, Title } from './styles';
import {
  DESCRIPTION_FIELD_RULES,
  FormValues,
  MAX_NUM_SERVICES_FIELD_RULES,
  MaxNumServicesLabel,
  NAME_FIELD_RULES,
  REWARDS_PER_SECOND_FIELD_RULES,
  RewardsPerSecondLabel,
  TextWithTooltip,
  WrongNetworkAlert,
  checkImplementationVerified,
} from './utils';

const { Paragraph, Text } = Typography;

const contractTemplate = CONTRACT_TEMPLATES[0];
const INPUT_WIDTH_STYLE = { width: '100%' };

export const CreateStakingContract = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorType>(null);
  const params = useParams<{ network: string }>();
  const networkName = params?.network as string;

  const { address: account, chain } = useAccount();

  const networkId = getChainIdFromPath(networkName);
  const wrongNetwork = chain && networkId ? networkId !== chain.id : false;

  const handleCreate = async (values: FormValues) => {
    if (!account) {
      notifyConnectWallet();
      return;
    }

    if (!chain?.id) return;

    if (!isSupportedChainId(chain.id)) {
      throw new Error('Network not supported');
    }

    if (wrongNetwork) {
      notifyWrongNetwork();
      return;
    }

    setError(null);
    setIsLoading(true);

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

      // Validations
      if (!(await checkImplementationVerified(chain.id, implementation))) {
        throw new Error('Validation failed');
      }

      const result = await createStakingContract({ implementation, initPayload, account });
      if (result) {
        const eventLog = result.events?.InstanceCreated?.returnValues;

        if (eventLog) {
          dispatch(
            addStakingContract({
              id: eventLog.instance,
              chainId: chain.id,
              name,
              description,
              template: contractTemplate.title,
              isNominated: false,
            }),
          );
        }
        router.push(`/${networkName}/${URL.myStakingContracts}`);
      }
    } catch (error) {
      console.log(error);

      const { message, transactionHash } = getErrorInfo(Feature.CREATE, error as Error);
      setError({ message, transactionHash });
    } finally {
      setIsLoading(false);
    }
  };

  const alertMessage = useMemo(() => {
    if (wrongNetwork) return <WrongNetworkAlert networkId={networkId} />;
    if (error) return <ErrorAlert error={error} networkId={networkId} />;
    return null;
  }, [wrongNetwork, error, networkId]);

  return (
    <StyledMain>
      <Card>
        <Title>Create staking contract on {CHAIN_NAMES[networkId || mainnet.id]}</Title>

        {alertMessage}

        <Form layout="vertical" onFinish={handleCreate} requiredMark={false}>
          <Form.Item
            label={<Text type="secondary">Name</Text>}
            name="name"
            rules={NAME_FIELD_RULES}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={<Text type="secondary">Description</Text>}
            name="description"
            className="mb-0"
            rules={DESCRIPTION_FIELD_RULES}
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
                rules={MAX_NUM_SERVICES_FIELD_RULES}
              >
                <InputNumber placeholder="e.g. 6" step="1" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<RewardsPerSecondLabel />}
                name="rewardsPerSecond"
                rules={REWARDS_PER_SECOND_FIELD_RULES}
              >
                <InputNumber placeholder="e.g. 0.0003" step="0.0001" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
          </Row>
          <Flex justify="end" gap={12}>
            <Link href={`/${networkName}/${URL.myStakingContracts}`} passHref>
              <Button>Cancel</Button>
            </Link>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Create contract
            </Button>
          </Flex>
        </Form>
      </Card>
    </StyledMain>
  );
};
