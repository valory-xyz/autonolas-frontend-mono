import { ArrowUpOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';
import { ethers } from 'ethers';
import { useReadContract } from 'wagmi';

import { COLOR } from 'libs/ui-theme/src/lib/ui-theme';
import { VE_OLAS } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { useAppSelector } from 'store/index';

import { GET_VEOLAS_URL } from 'common-util/constants/urls';

const { Text, Paragraph } = Typography;

const Balance = () => {
  const { chainId, account } = useAppSelector((state) => state.setup);

  const { data, isFetching } = useReadContract({
    address: (VE_OLAS.addresses as Record<number, `0x${string}`>)[chainId as number],
    abi: VE_OLAS.abi,
    functionName: 'balanceOf',
    args: [account],
    query: {
      enabled: !!account,
      select: (data) => ethers.formatUnits(data as string, 18),
      staleTime: Infinity,
    },
  });

  if (isFetching) return null;
  if (data === undefined) return null;

  return (
    <Tooltip
      color={COLOR.WHITE}
      title={
        <>
          <Paragraph>veOLAS gives you voting power in Autonolas governance.</Paragraph>
          <a href={GET_VEOLAS_URL} target="_blank">
            Lock OLAS for veOLAS <ArrowUpOutlined style={{ rotate: '45deg' }} />
          </a>
        </>
      }
    >
      <Button type="text">
        <Text type="secondary" className="mr-8">
          <InfoCircleOutlined className="mr-8" />
          Your voting power:
        </Text>
        <Text strong>{data} veOLAS</Text>
      </Button>
    </Tooltip>
  );
};

export default Balance;
