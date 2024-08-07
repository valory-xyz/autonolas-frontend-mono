import { Button, Typography } from 'antd';
import Link from 'next/link';
import styled from 'styled-components';

const { Title } = Typography;

const NotLegalContainer = styled.div`
  position: relative;
  top: 100px;
  text-align: center;
`;

export const PageNotFound = () => (
  <NotLegalContainer>
    <Title level={4}>Error 404 - we couldn&apos;t find that page</Title>
    <Link href="ethereum/services" passHref>
      <Button size="large" type="link">
        Check out services on Ethereum
      </Button>
    </Link>
  </NotLegalContainer>
);
