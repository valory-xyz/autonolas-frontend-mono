/* eslint-disable react/no-unstable-nested-components */
import { Typography } from 'antd';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import remarkGfm from 'remark-gfm';

import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph } = Typography;

const markdown = `Abstract:
In this specific case the AI Mech project demonstrates a smart contract protocol with an interface that can allow users on-chain (public addresses on evm blockchains) to make requests in the form of an evm transaction for an off-chain agent to do some work in exchange for payment in the form of cryptocurrency. This application has a wide range of use cases from trivial examples of using a call to the request function in the AgentMech contract in order to input a prompt for GPT then have it respond with some text all the way to inputting a request to complete some complex action and having AI and/or an automated off-chain process within the off-chain agent execute programmatic instructions in a generalized way with only text as input.

For the demo mech we use the Autonolas Open Autonomy framework (https://docs.autonolas.network) to construct an autonomous service that acts as an off-chain agent.

The code for the autonomous service can be found here: https://github.com/valory-xyz/mech

### Autonomous Service Capabilities:
- Read indexed on-chain data/events about on-chain state using a subgraph.
- Read data from the IPFS network based on a given IPFS hash
- Make calls to external APIs (OpenAI API to begin with)
- Store data in IPFS to store data used to make responses to requests
- Make calls to evm blockchains creating transactions to return data about the work they do after on-chain requests are fulfilled`;

const HighLevelSpec = () => (
  <div id={DOCS_SECTIONS['high-level-spec']}>
    <Title level={3}>
      High Level Specification of Off-Chain Agents that take input from the AgentMechs
    </Title>

    <Paragraph>
      <a href="https://github.com/valory-xyz/mech/tree/main" target="_blank" rel="noreferrer">
        Source
      </a>
    </Paragraph>

    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
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

export default HighLevelSpec;
