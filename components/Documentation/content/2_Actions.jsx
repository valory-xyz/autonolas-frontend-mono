import { Typography } from 'antd/lib';
import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph } = Typography;

const ActionsDocs = () => (
  <div id={DOCS_SECTIONS.actions}>
    <Title level={2}>On-chain Protocol</Title>
    <Paragraph>
      <a
        href="https://github.com/valory-xyz/ai-registry-mech/tree/main/contracts"
        target="_blank"
        rel="noreferrer"
      >
        Source
      </a>
    </Paragraph>

    <Title level={5}>AgentMech</Title>
    <Paragraph>
      <p>Constructor:</p>
      <ul>
        <li>ERC721Mech constructor</li>
        <li>set agent (NFT) owner as corresponding agentId owner address</li>
      </ul>

      <p>Events:</p>
      <ul>
        <li>
          Deliver(requestId, data): AgentMech delivers a response to a task with
          the corresponding request id and data (e.g. IPFS hash)
        </li>
        <li>
          Request(sender, requestId, data): Sender requests a task with the
          corresponding request id and data (e.g. IPFS hash)
        </li>
        <li>
          PriceUpdated(uint256 price): AgentMech price is updated to the
          corresponding price by the mech ownner
        </li>
      </ul>

      <p>Storage:</p>
      <ul>
        <li>uint256 | price: price required to call</li>
      </ul>

      <p>Functions:</p>
      <ul>
        <li>
          request: requests a task with the corresponding request id and data
          (e.g. IPFS hash) for the AgentMech to perform
        </li>
        <li>
          deliver: delivers a response to a task/request with the corresponding
          request id and response data (e.g. IPFS hash)
        </li>
        <li>
          setPrice: sets the price required to call the AgentMech&apos;s request
          function
        </li>
        <li>
          getRequestId: returns the request id for a given account address and
          data
        </li>
      </ul>
    </Paragraph>

    <Title level={5}>AgentMech Metadata</Title>
    <Paragraph>An example of metadata for an AgentMech:</Paragraph>

    <br />
    <br />
    <br />
  </div>
);

export default ActionsDocs;
