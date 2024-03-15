/* eslint-disable jest/no-conditional-expect */
/* eslint-disable no-await-in-loop */
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
} from '../../common-util/AbiAndAddresses';
import {
  ADDRESSES,
  multisigAddresses,
  multisigSameAddresses,
} from '../../common-util/Contracts/addresses';

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
const registriesRepo =
  'https://raw.githubusercontent.com/valory-xyz/autonolas-registries/main/';

type Contract = {
  name: string;
  artifact: string;
  address: string;
};

type Chain = {
  name: string;
  chainId: keyof typeof ADDRESSES;
  contracts: Contract[];
};

describe('test-chains/TestChains.jsx', () => {
  it(
    'check contract addresses and ABIs',
    async () => {
      // Registries repository
      // Fetch the actual config
      const response = await fetch(`${registriesRepo}docs/configuration.json`);
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
              registriesRepo + currentContract.artifact,
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

  it('should have the ALL addresses for ALL the chains listed in ADDRESSES object', () => {
    // const chains = Object.keys(ADDRESSES);
    // it.each(chains)('should have the addresses for %s', (chain) => {
    //   const addresses = ADDRESSES[chain];
    //   expect(Object.keys(addresses).length).toBeGreaterThan(0);
    // });
  });
});
