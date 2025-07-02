import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';

const { Title } = Typography;

type HeaderTitleProps = {
  title: string;
  description?: string | null;
};

export const HeaderTitle = ({ title, description }: HeaderTitleProps) => (
  <Flex justify="space-between" align="center">
    <Title level={2} style={{ marginTop: 16 }}>
      {title}
    </Title>
    {description && (
      <div>
        <Tooltip title={description} placement="bottomLeft">
          <InfoCircleOutlined style={{ fontSize: 24, position: 'relative', top: -3 }} />
        </Tooltip>
      </div>
    )}
  </Flex>
);
