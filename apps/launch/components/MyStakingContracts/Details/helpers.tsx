import { Col, Flex, Typography } from 'antd';
import { ReactNode } from 'react';

const { Text } = Typography;

type ColFlexContainerProps = { text: string | ReactNode; content: ReactNode };

export const ColFlexContainer = ({ text, content }: ColFlexContainerProps) => {
  return (
    <Col span={12}>
      <Flex vertical gap={4} align="flex-start">
        {typeof text === 'string' ? <Text type="secondary">{text}</Text> : text}
        {content}
      </Flex>
    </Col>
  );
};
