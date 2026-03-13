import { Alert, Button, Flex, Typography } from 'antd';
import { CodeBlock } from 'components/CodeBlock';
import { STACK_URL } from 'libs/util-constants/src';
import styled from 'styled-components';
import { PageWrapper } from 'util/theme';

import data from './data.json';

const { Title, Text, Paragraph } = Typography;

const HireContainer = styled.div`
  padding-bottom: 24px;
  max-width: 1400px;
  margin: auto;
  ol.lower-alpha {
    list-style-type: lower-alpha;
  }
`;

const Prerequisites = () => (
  <div>
    <Title level={4}>Prerequisites</Title>
    {data.prerequisites.map((item) => (
      <CodeBlock key={item}>{item}</CodeBlock>
    ))}
  </div>
);

const Quickstart = () => (
  <Flex gap={24} vertical>
    <div>
      <Title level={4}>Quickstart</Title>
      <Text>{data.quickstartIntro}</Text>
    </div>
    <Flex vertical>
      {data.quickstartItems.map((item) => (
        <div key={item.title} className="mb-20">
          <Paragraph>
            <Text strong>{item.title}</Text>
          </Paragraph>
          <div>
            {item.codeBlocks.map((block, index) => (
              <CodeBlock key={`${item.title}${index}`} canCopy>
                {block}
              </CodeBlock>
            ))}
            {item.afterNote && (
              <>
                <Paragraph>{item.afterNote}</Paragraph>
                {item.afterCodeBlocks?.map((block, index) => (
                  <CodeBlock key={`${item.title}-after-${index}`} canCopy>
                    {block}
                  </CodeBlock>
                ))}
              </>
            )}
          </div>
        </div>
      ))}
    </Flex>
  </Flex>
);

const AlertMessage = (
  <>
    <p className="mt-0">{data.alertText}</p>
    <Button type="default" size="large">
      <a href={`${STACK_URL}${data.docsLink}`}>Explore Documentation</a>
    </Button>
  </>
);

export const HireAnAgent = () => (
  <PageWrapper>
    <HireContainer>
      <Title level={2} className="mb-0">
        {data.title}
      </Title>
      <Prerequisites />
      <Quickstart />
      <Alert message={AlertMessage} type="info" showIcon />
    </HireContainer>
  </PageWrapper>
);
