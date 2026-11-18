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
  isMultisigChainId,
  multisigCandidates,
} from '../../../common-util/Contracts/addresses';
// `docs/configuration.json` of valory-xyz/autonolas-registries at 5d5b1f1 (autonolas-registries#343),
// unchanged since cca0949e. Re-capture both fixtures when registries publishes new wrappers.
import pinnedRegistriesConfig from '../../fixtures/registries-configuration.json';
// `gnosisSafeMultisigImplementationAddress` of each `scripts/deployment` globals file named in it,
// at the same commit: the new wrappers, which `docs/configuration.json` does not list yet.
import pinnedSafeMultisigGlobals from '../../fixtures/registries-safe-multisig-globals.json';

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

/** As the fixture holds it: `chainId` is a string. */
type Chain = {
  name: string;
  chainId: string;
  contracts: Contract[];
};

const toChainId = (chainId: string): ChainIds => {
  const id = Number(chainId);
  if (!isMultisigChainId(id)) {
    throw new Error(
      `The pinned registries configuration has chain ${chainId}, which the app lacks`,
    );
  }
  return id;
};

const chainIds = Object.keys(ADDRESSES);
const pinnedChains = (pinnedRegistriesConfig as Chain[]).map((chain) => ({
  ...chain,
  chainId: toChainId(chain.chainId),
}));

const lowerFirst = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);

// Fetches registries' moving `main` branch, so it only runs when asked for.
const describeLive = process.env.REGISTRIES_LIVE_CHECK === 'true' ? describe : describe.skip;

const isValidKey = (object: object, value: string): value is keyof typeof object => {
  return Object.keys(object).includes(value);
};

describeLive('common-utils/addresses against registries main', () => {
  it(
    'check contract ABIs',
    async () => {
      const response = await fetch(`${REGISTRIES_REPO_URL}docs/configuration.json`);
      const parsedConfig: Chain[] = await response.json();

      for (const { contracts } of parsedConfig) {
        for (const currentContract of contracts) {
          const localArtifact = LOCAL_ARTIFACTS.find(
            (artifact) => artifact.contractName === currentContract.name,
          );
          if (!localArtifact) continue;

          const remoteArtifactResponse = await fetch(
            REGISTRIES_REPO_URL + currentContract.artifact,
          );
          const remoteArtifact = await remoteArtifactResponse.json();

          expect(localArtifact.abi).toMatchObject(remoteArtifact.abi);
        }
      }
    },
    2 * 60 * 1000,
  );
});

describe('common-utils/addresses', () => {
  // ServiceManager addresses are not kept in `ADDRESSES`, so only the contracts it holds are compared.
  it('holds the address the pinned registries configuration lists for each of its contracts', () => {
    const checked = pinnedChains.flatMap(({ chainId, contracts }) => {
      const local: Record<string, string> = ADDRESSES[chainId];
      return contracts
        .filter(({ name }) => LOCAL_ARTIFACTS.some(({ contractName }) => contractName === name))
        .filter(({ name }) => Object.hasOwn(local, lowerFirst(name)))
        .map(({ name, address }) => ({
          chainId,
          name,
          address,
          local: local[lowerFirst(name)],
        }));
    });

    expect(checked.length).toBeGreaterThan(0);
    checked.forEach(({ chainId, name, address, local }) => {
      expect({ chainId, name, address: local }).toEqual({
        chainId,
        name,
        address,
      });
    });
  });

  it('offers exactly the old and the new GnosisSafeMultisig of every chain, and no other', () => {
    const globals = pinnedSafeMultisigGlobals as Record<
      string,
      { gnosisSafeMultisigImplementationAddress: string }
    >;
    const expected = Object.fromEntries(
      pinnedChains.map(({ chainId, contracts }) => [
        chainId,
        [
          ...contracts
            .filter(({ name }) => name === 'GnosisSafeMultisig')
            .map(({ address }) => address),
          globals[chainId].gnosisSafeMultisigImplementationAddress,
        ],
      ]),
    );

    expect(Object.keys(globals).sort()).toEqual(Object.keys(expected).sort());
    expect(multisigCandidates).toEqual(expected);
  });

  it('offers no same-address adapter, which reuses a multisig, as a Safe creation wrapper', () => {
    const adapters = pinnedChains.flatMap(({ chainId, contracts }) =>
      contracts
        .filter(({ name }) => name.endsWith('SameAddressMultisig'))
        .map(({ address }) => ({ chainId, address: address.toLowerCase() })),
    );

    expect(adapters.length).toBeGreaterThan(0);
    adapters.forEach(({ chainId, address }) => {
      const candidates = multisigCandidates[chainId].map((c) => c.toLowerCase());
      expect({ chainId, offersAdapter: candidates.includes(address) }).toEqual({
        chainId,
        offersAdapter: false,
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
