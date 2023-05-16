import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import remarkGfm from 'remark-gfm';

const markdown = `# Overview of AI Mech Contracts

## Contracts

[Source](https://github.com/valory-xyz/ai-registry-mech/tree/main/contracts)

### AgentMech

Constructor:

- ERC721Mech constructor
- set agent owner as corresponding agentId owner address

Events:

- Perform(sender, taskHash): AgentMech performs a task with the corresponding task hash and sender address
- Deliver(requestId, data): AgentMech delivers a response to a task with the corresponding request id and data (ipfs hash)
- Request(sender, requestId, data): Sender requests a task with the corresponding request id and data (ipfs hash)
- PriceUpdated(uint256 price): AgentMech price is updated to the corresponding price by the agent mech ownner

Storage:

- uint256 | price: price required to call

Functions:

- request: requests a task with the corresponding request id and data (ipfs hash) for the AgentMech to perform
- deliver: delivers a response to a task/request with the corresponding request id and response data (ipfs hash)
- setPrice: sets the price required to call the AgentMech's request function
- getRequestId: returns the request id for a given account address and ipfs hash

Abstract:
Each agent is controlled by the AgentMech contract and its respective owner/request callers submitting data on-chain which is then indexed through/read by the off-chain process to accomplish some execution, then return the result back to the AgentMech in Deliver(). AgentMech is an NFT contract so its owner has the ability to transfer ownership to another address and interact with other smart contract protocols as would any other ERC721. AgentMech inherits from [ERC721Mech](https://github.com/gnosis/mech/blob/f6fa16551dba14fa8310fce0fd24c40be58fc7d1/contracts/ERC721Mech.sol) which is part of the Gnosis "Mech" library [here](https://github.com/gnosis/mech/tree/f6fa16551dba14fa8310fce0fd24c40be58fc7d1).

### ExtendedAgentFactory

Constructor:

- Extends AgentFactory constructor

Events:

- Extends AgentFactory's CreateMech event

Functions:

- addMech: adds a new mech to the corresponding agent using its agentId with the inputs registry address, agentId, and initial price for the AgentMech's construction

Abstract:
ExtendedAgentFactory is a periphery smart contract that inherits from AgentFactory for managing agent and mech creation for new and already existent agents.

### AgentFactory

Constructor:

- set corresponding agent registry address in immutable storage as input parameter
- set agent factory owner as msg.sender

Events:

- CreateMech(mech, agentId, price): New AgentMech is created with the corresponding mech address, agentId, and initial price for the AgentMech

Functions:

- create: creates a new AgentMech with the corresponding agent owner address, agent ipfs hash, and initial price for the AgentMech's construction

Abstract:
The Agent Factory is an implementation of [Generic Manager](https://github.com/valory-xyz/autonolas-registries/blob/00add36760c4b2faf5b5b11199af7d1ec38957fd/contracts/GenericManager.sol) as found in the [Autonolas protocol](https://docs.autonolas.network/protocol/) that is used for creation of new Agent Mech contracts with AgentFactory.create().

### AgentRegistry

Constructor:

- ERC721 constructor
- set agent registry owner as msg.sender

Events:

- CreateAgent(agentId, agentHash): Agent is created/minted to the agent owner address using AgentRegistry.create("agent owner address", "agent hash")
- UpdateAgentHash(agentId, agentHash): Agent hash is updated using AgentRegistry.updateHash("agent id", "agent hash")

Storage:

- Mapping | mapAgentIdHashes (agentId => agentIpfsHash): mapping used to map each agentId that exists in the contract to the corresponding agent ipfs hash

Functions:

- create: creates a new agent setting the agent owner address as the owner and agent ipfs hash as input to associate to an agentId (NOTE: each agent is an AgentMech which inherits from [ERC721Mech](https://github.com/gnosis/mech/blob/f6fa16551dba14fa8310fce0fd24c40be58fc7d1/contracts/ERC721Mech.sol) minted to the specified agent owner)
- updateHash: allows the agent owner to update the agent ipfs hash for a given agent id.
- getHashes: returns all ipfs hashes for a given agent id input

Absract:
The Agent Registry is an implementation of [generic registry](https://github.com/valory-xyz/autonolas-registries/blob/00add36760c4b2faf5b5b11199af7d1ec38957fd/contracts/GenericRegistry.sol) as found in the [Autonolas protocol](https://docs.autonolas.network/protocol/) where we have implemented functions agentRegistry.create(“agent owner”, “agent hash”) and agentRegistry.updateHash("agent id"). Create() adds an agent associated by its ipfs hash to the agent registry contract under a respective agentID and the owner of the agent with ID, "agentId", has ability to update a given agent's agent hash using UpdateHash(). Just like GenericRegistry it has a non fungible interface (ERC721) which means ownership of the AgentRegistry is transferable to different EOAs/smart wallets and the owner of the registry contract itself is set within the constructor of the contract during deployment.

## Libraries (Base inherited contracts => concrete implementations)

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
`;

const DocsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Docs = () => (
  <DocsContainer>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
  </DocsContainer>
);

export default Docs;
