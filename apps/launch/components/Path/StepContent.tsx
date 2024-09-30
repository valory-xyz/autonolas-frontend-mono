import { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { Button, Flex, Typography } from 'antd';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

import { SetNextStep, SetPrevStep } from './types';

const { Text, Title } = Typography;

const IconContainer = styled.div`
  display: flex;
  width: max-content;
  padding: 8px;
  border-radius: 6px;
  background: ${COLOR.PRIMARY_BG};
`;

const StyledUl = styled.ul`
  list-style-type: square;
  margin: 0;
  padding-left: 24px;
  li {
    padding-left: 8px;
    &::marker {
      color: #b972e8;
    }
  }
`;

type StepIconProps = {
  icon: React.ForwardRefExoticComponent<
    Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
  >;
};

const StepIcon = ({ icon: Icon }: StepIconProps) => (
  <IconContainer>
    <Icon style={{ color: COLOR.PRIMARY, fontSize: 24 }} />
  </IconContainer>
);

type StepListProps = {
  title: string;
  items: (string | React.ReactNode)[];
};

export const StepList = ({ title, items }: StepListProps) => (
  <Flex vertical gap={12}>
    <Text>{title}</Text>
    <StyledUl>
      {items.map((item, index) => (
        <li key={index}>
          <Text type="secondary">{item}</Text>
        </li>
      ))}
    </StyledUl>
  </Flex>
);

type StepContentProps = {
  icon: StepIconProps['icon'];
  title: string;
  children: React.ReactNode;
  onPrev: SetPrevStep;
  onNext: SetNextStep;
  isLast?: boolean;
};

export const StepContent = ({
  icon,
  title,
  children,
  onPrev,
  onNext,
  isLast,
}: StepContentProps) => (
  <Flex vertical gap={16}>
    <StepIcon icon={icon} />
    <Title level={4} className="m-0">
      {title}
    </Title>
    {children}
    <Flex justify="end" gap={12} className="mt-24">
      <Button size="large" onClick={onPrev}>
        Prev step
      </Button>
      {!isLast && (
        <Button type="primary" size="large" onClick={onNext}>
          Next step
        </Button>
      )}
    </Flex>
  </Flex>
);
