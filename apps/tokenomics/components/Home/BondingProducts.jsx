import { useState } from 'react';
import styled from 'styled-components';
import {
  Typography,
  Switch,
  Divider,
  Radio,
  Tooltip,
  Flex,
  Button,
} from 'antd';
import { useScreen } from '@autonolas/frontend-library';

import { BONDING_PRODUCTS } from 'common-util/enums';
import { useRouter } from 'next/router';
import { BondingList } from './Bonding/BondingList/BondingList';

const { Title } = Typography;

const PageHeader = styled.div`
  align-items: center;
  margin-bottom: 12px;
  display: ${(props) => (props.isMobile ? 'block' : 'flex')};
`;

const StyledDivider = styled(Divider)`
  margin: ${(props) => (props.isMobile ? '12px 0 ' : '0 12px')};
`;

const SwitchContainer = styled.div`
  align-items: center;
  display: flex;
`;

const ResponsiveDivider = () => {
  const { isMobile } = useScreen();

  return (
    <StyledDivider
      isMobile={isMobile}
      type={isMobile ? 'horizontal' : 'vertical'}
    />
  );
};

export const BondingProducts = () => {
  const router = useRouter();

  // if user not connected, show all products
  const [bondingProgramType, setProductType] = useState(
    BONDING_PRODUCTS.ACTIVE,
  );
  const [hideEmptyProducts, setHideEmptyProducts] = useState(true);
  const { isMobile } = useScreen();

  const onChange = (e) => {
    setProductType(e.target.value);
  };

  const onToggle = (checked) => {
    setHideEmptyProducts(checked);
  };

  return (
    <>
      <PageHeader isMobile={isMobile}>
        <Flex justify="space-between" align="center" style={{ width: '100%' }}>
          <Flex align="center">
            <Title level={4} className="mb-0 mt-0">
              Bonding Products
            </Title>
            <ResponsiveDivider />

            <Radio.Group onChange={onChange} value={bondingProgramType}>
              <Radio value={BONDING_PRODUCTS.ACTIVE}>Active</Radio>
              <Tooltip title="Currently displaying active products only. To view inactive products, call methods on the Depository contract via Etherscan.">
                <Radio value={BONDING_PRODUCTS.INACTIVE} disabled>
                  Inactive
                </Radio>
              </Tooltip>
            </Radio.Group>
            <ResponsiveDivider />

            <SwitchContainer>
              <Switch
                checked={hideEmptyProducts}
                onChange={onToggle}
                className="mr-8"
              />
              Hide empty products
            </SwitchContainer>
          </Flex>

          <Flex>
            <Button
              type="primary"
              ghost
              onClick={() => router.push('manage-solana-liquidity')}
            >
              Manage Solana Liquidity
            </Button>
          </Flex>
        </Flex>
      </PageHeader>

      <BondingList
        bondingProgramType={bondingProgramType}
        hideEmptyProducts={hideEmptyProducts}
      />
    </>
  );
};
