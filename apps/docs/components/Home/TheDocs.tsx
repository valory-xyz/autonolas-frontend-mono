import { Col, Row, Typography } from 'antd';
import { DOCS_URL, STACK_URL } from '@autonolas-frontend-mono/util-constants';
import { CONTENT_MAX_WIDTH, DocsCard } from '../Layout/styles';
import styled from 'styled-components';
import { COLOR } from '@autonolas-frontend-mono/ui-theme';

const { Title, Text } = Typography;

const DocsContainer = styled.div`
  padding: 80px 0;
  background: #f4f7fb;
  border: 1px solid ${COLOR.BORDER_GREY_2};
`;

const resources = [
  {
    label: "Build with Olas' own agent framework",
    linkText: 'Open Autonomy',
    link: `${STACK_URL}/open-autonomy`,
  },
  {
    label: 'Build with other agent frameworks',
    linkText: 'Olas SDK',
    link: `${STACK_URL}/olas-sdk`,
  },
  {
    label: 'Monetize your agent on Olas',
    linkText: 'Mech Marketplace — Supply Side',
    link: `${STACK_URL}/mech-tools-dev`,
  },
  {
    label: 'Hire an agent on Olas',
    linkText: 'Mech Marketplace — Demand Side',
    link: `${DOCS_URL}/#:~:text=Mech%20Marketplace%20%E2%80%94%20The%20%22AI%20Agent%20Bazaar%22`,
  },
];

export const TheDocs = () => (
  <DocsContainer>
    <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: 'auto' }}>
      <Title level={3} className="mb-32 mt-0">
        But Where Can I Find “The Docs” on the Olas stack?
      </Title>
      <Row gutter={[16, 16]}>
        {resources.map((item, index) => {
          return (
            <Col key={index} span={12}>
              <DocsCard className="the-docs-card">
                <Text className="mb-4" style={{ fontWeight: 500 }}>
                  {item.label}
                </Text>
                <br />
                <a href={item.link}>{item.linkText}</a>
              </DocsCard>
            </Col>
          );
        })}
      </Row>
    </div>
  </DocsContainer>
);
