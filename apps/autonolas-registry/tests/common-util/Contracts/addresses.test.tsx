/* eslint-disable jest/no-conditional-expect */
import fetch from 'node-fetch';
import {
  COMPONENT_REGISTRY_CONTRACT,
  AGENT_REGISTRY_CONTRACT,
  REGISTRIES_MANAGER_CONTRACT,
  SERVICE_REGISTRY_CONTRACT,
  SERVICE_REGISTRY_TOKEN_UTILITY_CONTRACT,
  SERVICE_REGISTRY_L2,
  SERVICE_MANAGER_CONTRACT,
  SERVICE_MANAGER_TOKEN_CONTRACT,
  OPERATOR_WHITELIST_CONTRACT,
} from '../../../common-util/AbiAndAddresses';
import {
  ADDRESSES,
  multisigAddresses,
  multisigSameAddresses,
  ChainIds,
  FALLBACK_HANDLER,
  safeMultiSend,
} from '../../../common-util/Contracts/addresses';
import {
  LOCAL_FORK_ID,
  LOCAL_FORK_ID_GNOSIS,
  LOCAL_FORK_ID_POLYGON,
} from '../../../util/constants';

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

const isValidKey = (
  object: object,
  value: string,
): value is keyof typeof object => {
  return Object.keys(object).includes(value);
};

const isLocalChainId = (chainId: string): boolean => {
  const id = Number(chainId);
  return [LOCAL_FORK_ID, LOCAL_FORK_ID_GNOSIS, LOCAL_FORK_ID_POLYGON].includes(
    id,
  );
};

describe('common-utils/addresses', () => {
  it(
    'check contract addresses and ABIs',
    async () => {
      // Registries repository
      // Fetch the actual config
      const response = await fetch(
        `${REGISTRIES_REPO_URL}docs/configuration.json`,
      );
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

          if (!localArtifact) return;

          // Go over local artifacts
          // for (let k = 0; k < LOCAL_ARTIFACTS.length; k += 1) {
          if (currentContract.name === 'GnosisSafeMultisig') {
            // Check for the GnosisSafeMultisig address
            const multisigAddressesChainId =
              chainId as keyof typeof multisigAddresses;

            expect(currentContract.address).toBe(
              multisigAddresses[multisigAddressesChainId][0],
            );
          } else if (currentContract.name === 'GnosisSafeSameAddressMultisig') {
            // Check for the GnosisSafeSameAddressMultisig address
            const multisigSameAddressesChainId =
              chainId as keyof typeof multisigSameAddresses;

            expect(currentContract.address).toBe(
              multisigSameAddresses[multisigSameAddressesChainId][0],
            );
          } else if (currentContract.name === localArtifact.contractName) {
            // Take the configuration and local contract names that match
            // Get local and configuration ABIs, stringify them
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
            // Need to stringify and then convert tstringain to access the address field
            const addressStruct = JSON.stringify(ADDRESSES[chainId]);
            const addressStructJSON = JSON.parse(addressStruct);
            const localAddress = addressStructJSON[lowLetter];
            expect(localAddress).toBe(currentContract.address);
          }
        }
      }
    },
    2 * 60 * 1000,
  );

  it('should ensure `safeMultiSend` matches between remote and local sources', async () => {
    const remoteResponseRaw = await fetch(
      `${REGISTRIES_SAFE_URL}/multi_send_call_only.json`,
    );
    const remoteResponse = await remoteResponseRaw.json();

    if (!remoteResponse.networkAddresses) {
      throw new Error(`Invalid ${name} remoteResponse`);
    }

    chainIds.forEach((chainId) => {
      if (!isValidKey(ADDRESSES, chainId)) {
        throw new Error(`Invalid chainId: ${chainId}`);
      }

      // no need to check local chainIds
      if (isLocalChainId(chainId)) return;

      const remoteMultisigAddress = remoteResponse.networkAddresses[chainId];
      const localMultisigAddress = safeMultiSend[chainId][0];

      expect(remoteMultisigAddress).toBe(localMultisigAddress);
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

      // no need to check local chainIds
      if (isLocalChainId(chainId)) return;

      // check if the remote fallback handler address matches the local one
      const remoteFallbackHandlerAddress =
        fallbackHandler.networkAddresses[chainId];
      const localFallbackHandlerAddress = FALLBACK_HANDLER[chainId];
      expect(remoteFallbackHandlerAddress).toBe(localFallbackHandlerAddress);
    });
  });
});
