/* eslint-disable react/no-children-prop */
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

const DocsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const markdown = `# Overview of AI Mech Architecture

## 1. Off-chain Agent (AI Worker)

Any autonomous agent or bot that runs off-chain, executes AI tasks and holds a wallet for signing transactions.

## 2. On-chain Protocol

[Source](https://github.com/valory-xyz/ai-registry-mech/tree/main/contracts)

### AgentMech
Constructor:
- ERC721Mech constructor
- set agent (NFT) owner as corresponding agentId owner address

Events:
- Deliver(requestId, data): AgentMech delivers a response to a task with the corresponding request id and data (e.g. IPFS hash)
- Request(sender, requestId, data): Sender requests a task with the corresponding request id and data (e.g. IPFS hash) 
- PriceUpdated(uint256 price): AgentMech price is updated to the corresponding price by the mech ownner

Storage:
- uint256 | price: price required to call 

Functions:
- request: requests a task with the corresponding request id and data (e.g. IPFS hash) for the AgentMech to perform
- deliver: delivers a response to a task/request with the corresponding request id and response data (e.g. IPFS hash)
- setPrice: sets the price required to call the AgentMech's request function
- getRequestId: returns the request id for a given account address and data
#### AgentMech Metadata

An example of metadata for an AgentMech:
~~~json
{
  "name":"Autonolas Mech III",
  "description":"The mech executes AI tasks requested on-chain and delivers the results to the requester.",
  "inputFormat":"ipfs-v0.1",
  "outputFormat":"ipfs-v0.1",
  "tools": ["openai-text-davinci-002", "openai-text-davinci-003", "openai-gpt-3.5-turbo", "openai-gpt-4"]
  "image":"ipfs://bafybeidzpenez565d7vp7jexfrwisa2wijzx6vwcffli57buznyyqkrceq"
}
~~~

In this case, the mech signals that it accepts the specified tools.

#### Request Lifecycle:

1. Requester calls AgentMech.request() with the corresponding data (e.g. IPFS hash)
The demo mech accepts as data an IPFS hash that points to a json file with the following format:

Request

~~~json
{
    "prompt": "The request prompt goes here",
    "tool": "The tool we want the off-chain agent to use goes here, for example openai-gpt4",
    "nonce": "The uuid goes here"
}
~~~
2. In the context of the above AgentMech metadata example, the tool would have to be one of the specified tools, e.g. "openai-text-davinci-003".
2. AgentMech emits Request() event with the corresponding request id and data (IPFS hash)
3. Off-chain agent listens for Request() events to read new request data on IPFS associated to a given request id and IPFS hash inside the Request() event on-chain.
4. Off-chain agent uses the specified tool in the request data to return a response to the request in the form of data on IPFS at a given IPFS hash.
IPFS data format for responses:

Deliver
~~~json
{
    "requestId": "<ID>",
    "result": "Off-chain agent's response to the request prompt goes here",
}
~~~
6. Off-chain agent calls the deliver() function on-chain with the corresponding request id and response data (IPFS hash)

Abstract:
Each off-chain agent is instructed on-chain via the AgentMech contract's request() function and the off-chain agent delivers results via the deliver() function. AgentMech inherits from [ERC721Mech](https://github.com/gnosis/mech/blob/f6fa16551dba14fa8310fce0fd24c40be58fc7d1/contracts/ERC721Mech.sol) which is part of the Gnosis "Mech" library [here](https://github.com/gnosis/mech/tree/f6fa16551dba14fa8310fce0fd24c40be58fc7d1).


### AgentRegistry
Constructor:
- ERC721 constructor
- set AgentRegistry owner as msg.sender

Events:
- CreateAgent(agentId, agentHash): AgentNFT is created/minted to the AgentNFT owner address using AgentRegistry.create("AgentNFT owner address", "AgentNFT hash")
- UpdateAgentHash(agentId, agentHash): AgentNFT hash is updated using AgentRegistry.updateHash("AgentNFT id", "AgentNFT hash")

Storage:
- Mapping | mapAgentIdHashes (agentId => agentIPFSHash): mapping used to map each agentId that exists in the contract to the corresponding AgentNFT IPFS hash

Functions:
- create: creates a new AgentNFT setting the AgentNFT owner address as the owner and AgentNFT IPFS hash as input to associate to an agentId (NOTE: each agent is an AgentMech which inherits from [ERC721Mech](https://github.com/gnosis/mech/blob/f6fa16551dba14fa8310fce0fd24c40be58fc7d1/contracts/ERC721Mech.sol) minted to the specified AgentNFT owner)
- updateHash: allows the AgentNFT owner to update the AgentNFT IPFS hash for a given agentId.
- getHashes: returns all IPFS hashes for a given agentId input

Abstract:
The AgentRegistry is an implementation of [generic registry](https://github.com/valory-xyz/autonolas-registries/blob/00add36760c4b2faf5b5b11199af7d1ec38957fd/contracts/GenericRegistry.sol) as found in the [Autonolas protocol](https://docs.autonolas.network/protocol/) where we have implemented functions agentRegistry.create(AgentNFT owner”, “agent hash”) and agentRegistry.updateHash("agent id"). Create() adds an AgentNFT associated by its IPFS hash to the AgentRegistry contract under a respective agentID and the owner of the AgentNFT with ID, "agentId", has ability to update a given AgentNFT's hash using UpdateHash(). Just like GenericRegistry it has a non fungible interface (ERC721) which means ownership of the AgentRegistry is transferable to different EOAs/smart wallets and the owner of the registry contract itself is set within the constructor of the contract during deployment.

### AgentFactory
Constructor:
- set corresponding AgentRegistry address in immutable storage as input parameter
- set AgentFactory owner as msg.sender

Events:
- CreateMech(mech, agentId, price): New AgentMech is created with the corresponding mech address, agentId, and initial price for the AgentMech

Functions:
- create: creates a new AgentMech with the corresponding AgentNFT owner address, AgentNFT IPFS hash, and initial price for the AgentMech's construction

Abstract:
The AgentFactory is an implementation of [Generic Manager](https://github.com/valory-xyz/autonolas-registries/blob/00add36760c4b2faf5b5b11199af7d1ec38957fd/contracts/GenericManager.sol) as found in the [Autonolas protocol](https://docs.autonolas.network/protocol/) that is used for creation of new AgentMech contracts with AgentFactory.create(). AgentFactory ties an AgentMech to an AgentNFT.

### Libraries (Base inherited contracts => concrete implementations)

- [Gnosis Mech Library, programmable ownership for smart accounts](https://github.com/gnosis/mech/tree/f6fa16551dba14fa8310fce0fd24c40be58fc7d1)
    - [Mech](https://github.com/gnosis/mech/blob/f6fa16551dba14fa8310fce0fd24c40be58fc7d1/contracts/base/Mech.sol)
    - [Immutable Storage](https://github.com/gnosis/mech/blob/f6fa16551dba14fa8310fce0fd24c40be58fc7d1/contracts/base/ImmutableStorage.sol)
        - [ERC721Mech](https://github.com/gnosis/mech/blob/f6fa16551dba14fa8310fce0fd24c40be58fc7d1/contracts/ERC721Mech.sol)
            - AgentMech.sol
- [Autonolas Registries](https://github.com/valory-xyz/autonolas-registries/tree/00add36760c4b2faf5b5b11199af7d1ec38957fd)
    - [Generic Registry](https://github.com/valory-xyz/autonolas-registries/blob/00add36760c4b2faf5b5b11199af7d1ec38957fd/contracts/GenericRegistry.sol)
        - Agent Registry
    - [Generic Manager](https://github.com/valory-xyz/autonolas-registries/blob/00add36760c4b2faf5b5b11199af7d1ec38957fd/contracts/GenericManager.sol)
        - Agent Factory
            - Extended Agent Factory

## 3. High Level Specification of Off-Chain Agents that take input from the AgentMechs

[Source](https://github.com/valory-xyz/mech/tree/main)

Abstract:
In this specific case the AI Mech project demonstrates a smart contract protocol with an interface that can allow users on-chain (public addresses on evm blockchains) to make requests in the form of an evm transaction for an off-chain agent to do some work in exchange for payment in the form of cryptocurrency. This application has a wide range of use cases from trivial examples of using a call to the request function in the AgentMech contract in order to input a prompt for GPT then have it respond with some text all the way to inputting a request to complete some complex action and having AI and/or an automated off-chain process within the off-chain agent execute programmatic instructions in a generalized way with only text as input.

For the demo mech we use the Autonolas Open Autonomy framework (https://docs.autonolas.network) to construct an autonomous service that acts as an off-chain agent.

The code for the autonomous service can be found here: https://github.com/valory-xyz/mech

### Autonomous Service Capabilities:
- Read indexed on-chain data/events about on-chain state using a subgraph.
- Read data from the IPFS network based on a given IPFS hash
- Make calls to external APIs (OpenAI API to begin with)
- Store data in IPFS to store data used to make responses to requests
- Make calls to evm blockchains creating transactions to return data about the work they do after on-chain requests are fulfilled`;

const Docs = () => (
  <DocsContainer>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      children={markdown}
      components={{
        code({
          node, inline, className, children, ...props
        }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              {...props}
              children={String(children).replace(/\n$/, '')}
              language={match[1]}
              PreTag="div"
            />
          ) : (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
      }}
    />
  </DocsContainer>
);

export default Docs;
