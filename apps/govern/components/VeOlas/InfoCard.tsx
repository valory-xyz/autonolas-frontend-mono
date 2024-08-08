import { Skeleton, Tooltip, Typography } from 'antd';
import styled from 'styled-components';
import { useAccount } from 'wagmi';

import { COLOR } from 'libs/ui-theme/src';

const { Title } = Typography;

const InfoCardContainer = styled.div`
  padding: 16px 0;
  h5 {
    font-weight: normal;
  }
`;

const ValueText = styled.div`
  font-size: 30px;
  font-style: normal;
  font-weight: 700;
  line-height: 38px;
  letter-spacing: -0.9px;

  /* ellipsis */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

type InfoCard = {
  isLoading: boolean;
  title?: string;
  value: string;
  tooltipValue?: string;
};

const Shimmer = ({ active = true }) => <Skeleton.Input active={active} style={{ maxWidth: 60 }} />;

export const InfoCard = ({ isLoading, title, value, tooltipValue }: InfoCard) => {
  const { isConnected } = useAccount();

  return (
    <InfoCardContainer>
      {title && (
        <Title level={5} type="secondary" className="mt-0 mb-8">
          {title}
        </Title>
      )}

      <ValueText>
        {isLoading ? (
          <Shimmer />
        ) : (
          <Tooltip
            open={tooltipValue ? undefined : false}
            placement="topLeft"
            title={isConnected ? tooltipValue : '--'}
            color={COLOR.BLACK}
          >
            {isConnected ? value : '--'}
          </Tooltip>
        )}
      </ValueText>
    </InfoCardContainer>
  );
};
