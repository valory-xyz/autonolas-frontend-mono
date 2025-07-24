import { Typography } from 'antd';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const { Text } = Typography;

type ExtendedReactMarkdownProps = {
  content: string;
  rows: number;
};

function ExtendedReactMarkdown({ content, rows }: ExtendedReactMarkdownProps) {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded(true);
  };

  const visibleContent = expanded ? content : content.split('\n').slice(0, rows).join('\n');
  const showExpansionLink = !expanded && content.split('\n').length > rows;

  return (
    <div>
      <Text>
        <ReactMarkdown>{visibleContent}</ReactMarkdown>
      </Text>
      {showExpansionLink && (
        <Text type="secondary" underline onClick={handleExpand} style={{ cursor: 'pointer' }}>
          Show more
        </Text>
      )}
    </div>
  );
}

export default ExtendedReactMarkdown;
