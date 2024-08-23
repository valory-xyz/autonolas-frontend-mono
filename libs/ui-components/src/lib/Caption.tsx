import { Typography } from 'antd';
import { ReactNode } from 'react';
import styled from 'styled-components';

const { Text } = Typography;

const SmallText = styled(Text)`
  font-size: 14px;
`;

export const Caption = ({ children, className }: { children: ReactNode; className?: string }) => (
  <SmallText type="secondary" className={className}>
    {children}
  </SmallText>
);
