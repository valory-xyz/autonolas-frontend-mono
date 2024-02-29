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
// import {
//   ADDRESSES,
//   multisigAddresses,
//   multisigSameAddresses,
// } from '../../common-util/Contracts/addresses';

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
  chainId: string;
  contracts: Contract[];
};

// type Abi = {
//   name: string;
//   abi: string;
// };

describe.skip('test-chains/TestChains.jsx', () => {
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
        // Traverse all tup-to-date configuration contracts
        for (let j = 0; j < contracts.length; j += 1) {
          console.log(contracts);
          const currentContract = contracts[j];

          // Go over local artifacts
          for (let k = 0; k < LOCAL_ARTIFACTS.length; k += 1) {
            //   if (contracts[j].name === 'GnosisSafeMultisig') {
            //     // Check for the GnosisSafeMultisig address
            //     expect(contracts[j].address).toBe(multisigAddresses[chainId][0]);
            //   } else if (contracts[j].name === 'GnosisSafeSameAddressMultisig') {
            //     // Check for the GnosisSafeSameAddressMultisig address
            //     expect(contracts[j].address).toBe(
            //       multisigSameAddresses[chainId][0],
            //     );
            //   } else if (contracts[j].name === LOCAL_ARTIFACTS[k].contractName) {
            // Take the configuration and local contract names that match
            // Get local and configuration ABIs, stringify them
            const localAbi = JSON.stringify(LOCAL_ARTIFACTS[k].abi);

            // Get up-to-date remote contract artifact and its ABI
            const remoteArtifactResponse = await fetch(registriesRepo + currentContract.artifact);
            const remoteArtifact = await remoteArtifactResponse.json();
            
            console.log(LOCAL_ARTIFACTS[k].contractName, ' << -- >> ',currentContract.name);

            // Stringify the remote ABI and compare with the local one
            const remoteAbi = JSON.stringify(remoteArtifact.abi);
            expect(localAbi).toBe(remoteAbi);

            // // Check the address
            // const lowLetter =
            //   LOCAL_ARTIFACTS[k].contractName.charAt(0).toLowerCase() +
            //   LOCAL_ARTIFACTS[k].contractName.slice(1);
            // // Need to stringify and then convert to JSON again to access the address field
            // const addressStruct = JSON.stringify(ADDRESSES[chainId]);
            // const addressStructJSON = JSON.parse(addressStruct);
            // const localAddress = addressStructJSON[lowLetter];
            // expect(localAddress).toBe(contracts[j].address);
          }
        }
      }
    },
    2 * 60 * 1000,
  );
});
