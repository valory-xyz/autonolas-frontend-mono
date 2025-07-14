import { InfoCircleOutlined } from '@ant-design/icons';
import { Col, Popover, Row, Typography } from 'antd';
import { TitleProps } from 'antd/es/typography/Title';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { getEducationItemByComponent } from 'common-util/functions';

const { Title } = Typography;

type EducationItem = {
  text: string;
  docsLink?: string;
};

type PopoverContentProps = EducationItem;

const PopoverContent = ({ text, docsLink = '' }: PopoverContentProps) => (
  <>
    {text}
    {docsLink && (
      <>
        <br />
        <Link href={`/docs${docsLink}`}>Learn more</Link>
      </>
    )}
  </>
);

type EducationItemProps = {
  title?: string;
  level?: TitleProps['level'];
  educationItem: string;
};

/**
 * Education title component
 */
export const EducationTitle = ({ title = '', level = 4, educationItem }: EducationItemProps) => {
  const [fullEducationItem, setFullEducationItem] = useState<EducationItem | null>(null);
  const { text, docsLink } = fullEducationItem || { text: '', docsLink: '' };

  useEffect(() => {
    const intFullEducationItem = getEducationItemByComponent(educationItem);
    setFullEducationItem(intFullEducationItem);
  }, [educationItem]);

  return (
    <Row gutter={8} align="middle">
      <Col>
        <Title level={level} className="mb-0">
          {title}
        </Title>
      </Col>
      <Col>
        <Popover
          content={<PopoverContent text={text || ''} docsLink={docsLink} />}
          placement="topLeft"
          overlayInnerStyle={{ maxWidth: 300 }}
        >
          <InfoCircleOutlined className="mb-0" />
        </Popover>
      </Col>
    </Row>
  );
};
