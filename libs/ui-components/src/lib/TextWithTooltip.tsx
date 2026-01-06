import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';
import { ReactNode } from 'react';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { COLOR } from 'libs/ui-theme/src';

const { Paragraph, Text } = Typography;

/**
 * This component is used in forms to display a label with the "secondary" type
 * and an info icon that has a tooltip when you hover over it.
 */
export const LabelWithTooltip = ({
  text,
  description,
}: {
  text: string;
  description: string | ReactNode;
}) => (
  <Tooltip color={COLOR.WHITE} title={<Paragraph className="m-0">{description}</Paragraph>}>
    <Text type="secondary">
      {text} <InfoCircleOutlined className="ml-4" />
    </Text>
  </Tooltip>
);

/**
 * This component is used in tables or anywhere else to display text
 * with an info icon and a tooltip on hover.
 */
export const TextWithTooltip = ({
  text,
  description,
}: {
  text: string;
  description: string | ReactNode;
}) => (
  <Tooltip color={COLOR.WHITE} title={<Paragraph className="m-0">{description}</Paragraph>}>
    {text} <InfoCircleOutlined className="ml-4" />
  </Tooltip>
);
