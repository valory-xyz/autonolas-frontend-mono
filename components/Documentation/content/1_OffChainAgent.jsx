/* eslint-disable react/no-unstable-nested-components */
import { Typography } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { DOCS_SECTIONS } from '../helpers';

const { Title } = Typography;

const markdown = `Any autonomous agent or bot that runs off-chain, executes AI tasks and holds a wallet for signing transactions.
`;

const OffChainAgent = () => (
  <div id={DOCS_SECTIONS['off-chain-agent']}>
    <Title level={3}>Off-chain Agent (AI Worker)</Title>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({
          node, inline, className, children, ...props
        }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter {...props} language={match[1]} PreTag="div">
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>

    <br />
    <br />
  </div>
);

export default OffChainAgent;
