import { Alert, Button, Flex, Typography } from 'antd';
import { CodeBlock } from 'components/CodeBlock';
import { COLOR } from 'libs/ui-theme/src';
import { STACK_URL } from 'libs/util-constants/src';
import Link from 'next/link';
import styled from 'styled-components';
import { PageWrapper } from 'util/theme';

import data from './data.json';

const { Title, Paragraph, Text } = Typography;

const MonetizeContainer = styled.div`
  padding-bottom: 24px;
  max-width: 1400px;
  margin: auto;
  ol.lower-alpha {
    list-style-type: lower-alpha;
  }
`;

const StyledBlockquote = styled.blockquote`
  margin: 12px 0 0;
  padding: 0 0 0 16px;
  border-left: 4px solid ${COLOR.BORDER_GREY_2};
  color: rgba(0, 0, 0, 0.65);
`;

type TextSegment = {
  text: string;
  code?: boolean;
};

type ContentBlock =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'richText'; segments: TextSegment[] }
  | {
      type: 'note';
      title: string;
      value?: string;
      segments?: TextSegment[];
      children?: ContentBlock[];
    };

const RichTextSegments = ({ segments }: { segments: TextSegment[] }) => (
  <>
    {segments.map((seg, i) =>
      seg.code ? (
        <Text key={i} code>
          {seg.text}
        </Text>
      ) : (
        <span key={i}>{seg.text}</span>
      ),
    )}
  </>
);

const ContentBlockRenderer = ({ block }: { block: ContentBlock }) => {
  switch (block.type) {
    case 'text':
      return <Paragraph>{block.value}</Paragraph>;
    case 'code':
      return <CodeBlock canCopy>{block.value}</CodeBlock>;
    case 'richText':
      return (
        <Paragraph>
          <RichTextSegments segments={block.segments} />
        </Paragraph>
      );
    case 'note':
      return (
        <StyledBlockquote>
          <Text strong>{block.title}</Text>{' '}
          {block.segments ? <RichTextSegments segments={block.segments} /> : block.value}
          {block.children && (
            <>
              <br />
              <br />
              {block.children.map((child, index) => (
                <ContentBlockRenderer key={index} block={child} />
              ))}
            </>
          )}
        </StyledBlockquote>
      );
    default:
      return null;
  }
};

type QuickstartItem = {
  title: string;
  description?: string;
  contentBlocks?: ContentBlock[];
  codeBlocks?: string[];
};

const Prerequisites = () => (
  <div>
    <Title level={4} className="mb-16">
      Prerequisites
    </Title>
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
      {(data.quickstartItems as QuickstartItem[]).map((item) => (
        <div key={item.title} className="mb-20">
          <Paragraph>
            <Text strong>{item.title}</Text>
          </Paragraph>
          {item.contentBlocks ? (
            <>
              {item.contentBlocks.map((block, index) => (
                <ContentBlockRenderer key={`${item.title}-block-${index}`} block={block} />
              ))}
              {item.codeBlocks && item.codeBlocks.length > 0 && (
                <div>
                  {item.codeBlocks.map((block, index) => (
                    <CodeBlock key={`${item.title}${index}`} canCopy>
                      {block}
                    </CodeBlock>
                  ))}
                </div>
              )}
            </>
          ) : item.description ? (
            <>
              <Paragraph>{item.description}</Paragraph>
              {item.codeBlocks && (
                <div>
                  {item.codeBlocks.map((block, index) => (
                    <CodeBlock key={`${item.title}${index}`} canCopy>
                      {block}
                    </CodeBlock>
                  ))}
                </div>
              )}
            </>
          ) : null}
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

export const MonetizeYourAgent = () => (
  <PageWrapper>
    <MonetizeContainer>
      <Title level={2} className="mt-0">
        {data.title}
      </Title>
      <Prerequisites />
      <Quickstart />
      <Paragraph>
        You and anyone else can now <Link href="/hire">hire your mech agent</Link>.
      </Paragraph>
      <Alert message={AlertMessage} type="info" showIcon />
    </MonetizeContainer>
  </PageWrapper>
);
