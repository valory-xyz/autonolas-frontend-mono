import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

// CONSTANTS
export const ACTIVE_TAB = '.ant-tabs-tab-active > div';
export const HEADER = '.ant-typography';

const mockStore = configureMockStore();
export const dummyAddress = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';
export const dummyAddress1 = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1000';
export const dummyHash = 'QmYuLhvusXYh2Pw5BqntNi9ZGg4Chcf1dhiuzxZesJCnK1';
export const dummyHash1 = 'bafybeidetrrkvdgveu4ph5g6v53lbh7ardfspbkpstmjxctx647bzyosyy';
export const emptyStore = mockStore({});

export const initStore = mockStore({
  setup: { account: dummyAddress, chainId: 1 },
});

/**
 *
 * @param {Component} component valid react component
 * @param {Boolean} isEmptyStore should the store need to be empty?
 * @returns
 */
export const wrapProvider = (component, isEmptyStore = false) => (
  <Provider store={isEmptyStore ? emptyStore : initStore}>{component}</Provider>
);

export const errorStore = mockStore({
  setup: { account: dummyAddress, errorMessage: 'Error in store' },
});

export const wrapProviderError = (component) => <Provider store={errorStore}>{component}</Provider>;

export const getTableTh = (i) => `.ant-table-thead > tr > th:nth-child(${i})`;

export const getTableTd = (i) =>
  `.ant-table-tbody > tr.ant-table-row.ant-table-row-level-0 > td:nth-child(${i})`;

export const mockV1Hash = '6f3212908f2e7a0249b67b05f237a40b76b7d8ef36d5620b281ceb47dcb6b122';

export const mockNftImageHash = 'Qmbh9SQLbNRawh9Km3PMEDSxo77k1wib8fYZUdZkhPBiev';

export const mockCodeUri =
  'f017012209cf4ae0b5d082843b3b34d0d400abbeffcb5a98b68ea89f3abf151f182315ab0';

export const mockIpfs = {
  image: `ipfs://${mockNftImageHash}`,
  name: 'Some package name',
  description: 'Some description',
  code_uri: `ipfs://${mockCodeUri}`,
  attributes: [{ trait_type: 'version', value: '0.0.0.1' }],
};

export const useHelpersEvmMock = {
  account: dummyAddress,
  vmType: 'EVM',
  chainId: 1,
  chainDisplayName: 'Ethereum',
  chainName: 'ethereum',
  isL1Network: true,
  doesNetworkHaveValidServiceManagerToken: true,
  links: { AGENTS: '/ethereum/agent-blueprints' },
  isConnectedToWrongNetwork: false,
  isSvm: false,
  isMainnet: true,
};

export const useHelpersBaseMock = {
  account: dummyAddress,
  vmType: 'EVM',
  chainId: 8453,
  chainDisplayName: 'Base',
  chainName: 'base',
  isL1Network: false,
  doesNetworkHaveValidServiceManagerToken: true,
  links: { AGENTS: '/base/agent-blueprints' },
  isConnectedToWrongNetwork: false,
  isSvm: false,
};

export const mockSvmAddress = 'DrGvsAxY8ehyXjE6qSZXcT5A9pTsUkVm3en5ZQD3Wm5x';

export const useHelpersSvmMock = {
  account: mockSvmAddress,
  vmType: 'SVM',
  chainId: null,
  chainDisplayName: 'Solana',
  chainName: 'solana',
  isL1Network: false,
  doesNetworkHaveValidServiceManagerToken: false,
  links: { SERVICES: '/solana/ai-agents' },
  isConnectedToWrongNetwork: false,
  isSvm: true,
};

export const svmConnectivityEmptyMock = {
  walletPublicKey: mockSvmAddress,
  tempWalletPublicKey: mockSvmAddress,
  connection: {},
  program: {},
  programId: null,
  solanaAddresses: null,
};

export const svmConnectivityMock = {
  walletPublicKey: mockSvmAddress,
  tempWalletPublicKey: mockSvmAddress,
  connection: {},
  program: {},
  programId: null,
  solanaAddresses: {
    pda: 'Gtb5et18X9b63Yex1wpPtKezeXznqDiqJ3zXh1WAqRxK',
    serviceRegistry: 'AU428Z7KbjRMjhmqWmQwUta2AvydbpfEZNBh8dStHTDi',
    storageAccount: 'AjHVkc5XV7wiH3KyqznfCGvMofmBQL8agF6HxCjn6H1R',
  },
};

export const svmServiceStateMock = {
  serviceOwner: 'DrGvsAxY8ehyXjE6qSZXcT5A9pTsUkVm3en5ZQD3Wm5x',
  securityDeposit: '01',
  multisig: 'CsZ2ZbCGALZ2p8Np9hFmgMDXVYg4X9i5zYN8nvbPYJ6D',
  configHash: '327277b25e86f19a5e4e5cf4bee643f3eb219067af05ca8929cb1cfcbf673b08',
  threshold: 1,
  maxNumAgentInstances: 1,
  numAgentInstances: 1,
  state: '4',
  agentIds: [5],
  slots: [1],
  bonds: [1],
  operators: ['DrGvsAxY8ehyXjE6qSZXcT5A9pTsUkVm3en5ZQD3Wm5x'],
  agentInstances: ['Em4vhJBAsohCNpNj2HpNaJs8jaQCprpkhvEZR2m9BL45'],
  agentIdForAgentInstances: [5],
  id: '10',
  owner: 'DrGvsAxY8ehyXjE6qSZXcT5A9pTsUkVm3en5ZQD3Wm5x',
};
