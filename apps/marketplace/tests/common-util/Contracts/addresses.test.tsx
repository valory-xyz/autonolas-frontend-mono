/* eslint-disable jest/no-conditional-expect */
import {
  AGENT_REGISTRY_CONTRACT,
  COMPONENT_REGISTRY_CONTRACT,
  OPERATOR_WHITELIST_CONTRACT,
  REGISTRIES_MANAGER_CONTRACT,
  SERVICE_MANAGER_CONTRACT,
  SERVICE_MANAGER_TOKEN_CONTRACT,
  SERVICE_REGISTRY_CONTRACT,
  SERVICE_REGISTRY_L2,
  SERVICE_REGISTRY_TOKEN_UTILITY_CONTRACT,
} from '../../../common-util/AbiAndAddresses';
import {
  ADDRESSES,
  ChainIds,
  FALLBACK_HANDLER,
  multisigCandidates,
} from '../../../common-util/Contracts/addresses';
// `docs/configuration.json` of valory-xyz/autonolas-registries at commit
// cca0949e806f5d98316db0463d1312960829499c. Re-capture it when registries publishes new wrappers.
import pinnedRegistriesConfig from '../../fixtures/registries-configuration.json';

const LOCAL_ARTIFACTS = [
  COMPONENT_REGISTRY_CONTRACT,
  AGENT_REGISTRY_CONTRACT,
  REGISTRIES_MANAGER_CONTRACT,
  SERVICE_REGISTRY_CONTRACT,
  SERVICE_REGISTRY_TOKEN_UTILITY_CONTRACT,
  SERVICE_REGISTRY_L2,
  SERVICE_MANAGER_CONTRACT,
  SERVICE_MANAGER_TOKEN_CONTRACT,
  OPERATOR_WHITELIST_CONTRACT,
];
const REGISTRIES_REPO_URL =
  'https://raw.githubusercontent.com/valory-xyz/autonolas-registries/main/';
const REGISTRIES_SAFE_URL =
  'https://raw.githubusercontent.com/safe-global/safe-deployments/main/src/assets/v1.3.0';

type Contract = {
  name: string;
  artifact: string;
  address: string;
};

type Chain = {
  name: string;
  chainId: ChainIds;
  contracts: Contract[];
};

const chainIds = Object.keys(ADDRESSES);

const isValidKey = (object: object, value: string): value is keyof typeof object => {
  return Object.keys(object).includes(value);
};

describe('common-utils/addresses', () => {
  it(
    'check contract addresses and ABIs',
    async () => {
      // Registries repository
      // Fetch the actual config
      const response = await fetch(`${REGISTRIES_REPO_URL}docs/configuration.json`);
      const parsedConfig: Chain[] = await response.json();

      // Loop over chains
      const numChains = parsedConfig.length;
      for (let i = 0; i < numChains; i += 1) {
        const { contracts, chainId } = parsedConfig[i];
        // Traverse all up-to-date configuration contracts
        for (let j = 0; j < contracts.length; j += 1) {
          const currentContract = contracts[j];

          const localArtifact = LOCAL_ARTIFACTS.find(
            (artifact) => artifact.contractName === currentContract.name,
          );
          if (!localArtifact) continue;

          // Fetch the remote artifact of the contract the configuration names
          const remoteArtifactResponse = await fetch(
            REGISTRIES_REPO_URL + currentContract.artifact,
          );
          const remoteArtifact = await remoteArtifactResponse.json();

          // Local and remote ABIs should match
          expect(localArtifact.abi).toMatchObject(remoteArtifact.abi);

          // Check the address
          const lowLetter =
            localArtifact.contractName.charAt(0).toLowerCase() +
            localArtifact.contractName.slice(1);
          const addressStruct = JSON.stringify(ADDRESSES[chainId]);
          const addressStructJSON = JSON.parse(addressStruct);
          const localAddress = addressStructJSON[lowLetter];
          expect(localAddress).toBe(currentContract.address);
        }
      }
    },
    2 * 60 * 1000,
  );

  it('offers every GnosisSafeMultisig the pinned registries configuration lists', () => {
    const wrappers = (pinnedRegistriesConfig as unknown as Chain[]).flatMap(
      ({ chainId, contracts }) =>
        contracts
          .filter(({ name }) => name === 'GnosisSafeMultisig')
          .map(({ address }) => ({ chainId, address })),
    );

    expect(wrappers.length).toBeGreaterThan(0);
    wrappers.forEach(({ chainId, address }) => {
      expect({ chainId, candidates: multisigCandidates[chainId] }).toEqual({
        chainId,
        candidates: expect.arrayContaining([address]),
      });
    });
  });

  it('should ensure FALLBACK_HANDLER matches between remote and local sources', async () => {
    const fallbackHandlerResponse = await fetch(
      `${REGISTRIES_SAFE_URL}/compatibility_fallback_handler.json`,
    );
    const fallbackHandler = await fallbackHandlerResponse.json();

    if (!fallbackHandler.networkAddresses) {
      throw new Error('Invalid fallbackHandler');
    }

    chainIds.forEach((chainId) => {
      if (!isValidKey(ADDRESSES, chainId)) {
        throw new Error(`Invalid chainId: ${chainId}`);
      }

      const remoteFallbackHandlerAddressKey = fallbackHandler.networkAddresses[chainId];

      // could be an array or a string
      // eg. 'canonical' or 'eip155' or ['eip155', 'canonical']
      const keyName = Array.isArray(remoteFallbackHandlerAddressKey)
        ? remoteFallbackHandlerAddressKey[0]
        : remoteFallbackHandlerAddressKey;

      // fetch the remote fallback handler address from `deployments` dictionary
      const { address: remoteAddress } = fallbackHandler.deployments[keyName];

      // check if the remote fallback handler address matches the local one
      const localFallbackHandlerAddress = FALLBACK_HANDLER[chainId];
      expect(remoteAddress).toBe(localFallbackHandlerAddress);
    });
  });
});
