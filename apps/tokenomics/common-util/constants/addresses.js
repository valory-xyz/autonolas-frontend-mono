import { LOCAL_FORK_ID, VM_TYPE } from '@autonolas/frontend-library';
import {
  DISPENSER,
  DEPOSITORY,
  BOND_CALCULATOR,
  AGENT_REGISTRY,
  COMPONENT_REGISTRY,
  SERVICE_REGISTRY,
  TREASURY,
  TOKENOMICS,
} from 'common-util/abiAndAddresses';

const LOCAL_ADDRESSES = {
  dispenser: '0x4c5859f0F772848b2D91F1D83E2Fe57935348029',
  depository: '0x1291Be112d480055DaFd8a610b7d1e203891C274',
  treasury: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
  tokenomics: '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00',
  genericBondCalculator: '0x809d550fca64d94Bd9F66E60752A544199cfAC3D',
  agent: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  component: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  service: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
  olasAddress: 'TODO', // TODO: run docker and get this address
};

const MAINNET_ADDRESSES = {
  dispenser: DISPENSER.addresses[1],
  depository: DEPOSITORY.addresses[1],
  treasury: TREASURY.addresses[1],
  tokenomics: TOKENOMICS.addresses[1],
  genericBondCalculator: BOND_CALCULATOR.addresses[1],
  agent: AGENT_REGISTRY.addresses[1],
  component: COMPONENT_REGISTRY.addresses[1],
  service: SERVICE_REGISTRY.addresses[1],
  olasAddress: '0x0001A500A6B18995B03f44bb040A5fFc28E45CB0',
};

const LOCAL_CHAIN_ID = 31337;

export const ADDRESSES = {
  1: MAINNET_ADDRESSES,
  5: {
    dispenser: DISPENSER.addresses[5],
    depository: DEPOSITORY.addresses[5],
    treasury: TREASURY.addresses[5],
    tokenomics: TOKENOMICS.addresses[5],
    genericBondCalculator: BOND_CALCULATOR.addresses[5],
    agent: AGENT_REGISTRY.addresses[5],
    component: COMPONENT_REGISTRY.addresses[5],
    service: SERVICE_REGISTRY.addresses[5],
    olasAddress: '0xEdfc28215B1Eb6eb0be426f1f529cf691A5C2400',
  },
  // NOTE: Except 1 & 5 other addresses are used for LP pairs
  // gnosis and gnosis testnet
  100: {
    olasAddress: '0xcE11e14225575945b8E6Dc0D4F2dD4C570f79d9f',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  },
  10200: {
    olasAddress: '0xE40AE73aa0Ed3Ec35fdAF56e01FCd0D1Ff1d9AB6',
  },

  // polygon and mumbai
  137: {
    olasAddress: '0xFEF5d947472e72Efbb2E388c730B7428406F2F95',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  },
  80001: {
    olasAddress: '0x81e7Ac2D5aCA991aef9187a34C0A536FA526dD0F',
  },

  // arbitrum
  42161: {
    olasAddress: '0x064f8b858c2a603e1b106a2039f5446d32dc81c1',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  },

  // optimism
  10: {
    olasAddress: '0xFC2E6e6BCbd49ccf3A5f029c79984372DcBFE527',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  },

  // base
  8453: {
    olasAddress: '0x54330d28ca3357F294334BDC454a032e7f353416',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  },

  // solana
  [VM_TYPE.SVM]: {
    olasAddress: 'Ez3nzG9ofodYCvEmw73XhQ87LWNYVRM2s7diB5tBZPyM',
    balancerVault: '5dMKUYJDsjZkAD3wiV3ViQkuq9pSmWQ5eAzcQLtDnUT3', // whirpool address
    wsolAddress: 'So11111111111111111111111111111111111111112',
  },

  [LOCAL_CHAIN_ID]: LOCAL_ADDRESSES,
  [LOCAL_FORK_ID]: MAINNET_ADDRESSES,
};
