import {
  Card, Row, Col, Typography, Flex, Button, Grid,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import Image from 'next/image';
import { COLOR } from '@autonolas/frontend-library';
import { useState } from 'react';

const { useBreakpoint } = Grid;

const StyledCard = styled(Card)`
  border-color: ${COLOR.BORDER_GREY};
  width: 100%;
  margin-bottom: 24px;
  .ant-card-body {
    padding: ${(props) => (props.md ? '64px' : '24px')};
    flex-direction: column;
    align-items: center;
  }
`;

export const Hero = () => {
  const [heroOpen, setHeroOpen] = useState(true);
  const { md } = useBreakpoint();

  return (
    heroOpen && (
    <StyledCard md={md}>
      <div // did not use styled component for this, css failed to apply
        style={{
          position: 'absolute', right: 10, top: 10, cursor: 'pointer',
        }}
      >
        <CloseOutlined
          onClick={() => setHeroOpen(false)}
          style={{ padding: 4 }}
        />
      </div>

      <Row gutter={64}>
        <Col md={12} xs={24}>
          <Image src="/images/bond.svg" fill className="mx-auto" />
        </Col>
        <Col md={12} xs={24}>
          <Flex vertical gap={16} style={{ height: '100%' }}>
            <Typography.Title level={3} className="mt-0 mb-0">
              Pool. Bridge. Bond.
            </Typography.Title>
            <Typography.Text>
              Pick a path and bond into the Olas protocol
              {' '}
              for the potential to receive discounted OLAS.
            </Typography.Text>
            <Flex style={{ justifySelf: 'end' }}>
              <Button type="default" onClick={() => setHeroOpen(false)}>🫡 Got it</Button>
            </Flex>
          </Flex>
        </Col>
      </Row>
    </StyledCard>
    )
  );
};
