import {
  arbitrum,
  base,
  celo,
  gnosis,
  gnosisChiado,
  goerli,
  mainnet,
  optimism,
  polygon,
  polygonMumbai,
} from 'viem/chains';

import {
  AGENT_REGISTRY,
  BOND_CALCULATOR,
  COMPONENT_REGISTRY,
  DEPOSITORY,
  DISPENSER,
  SERVICE_REGISTRY,
  TOKENOMICS,
  TREASURY,
} from 'libs/util-contracts/src/lib/abiAndAddresses';
import { VM_TYPE } from 'libs/util-constants/src';

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

export const ADDRESSES = {
  [mainnet.id]: MAINNET_ADDRESSES,
  [goerli.id]: {
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
  [gnosis.id]: {
    olasAddress: '0xcE11e14225575945b8E6Dc0D4F2dD4C570f79d9f',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  },
  [gnosisChiado.id]: {
    olasAddress: '0xE40AE73aa0Ed3Ec35fdAF56e01FCd0D1Ff1d9AB6',
  },
  [polygon.id]: {
    olasAddress: '0xFEF5d947472e72Efbb2E388c730B7428406F2F95',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  },
  [polygonMumbai.id]: {
    olasAddress: '0x81e7Ac2D5aCA991aef9187a34C0A536FA526dD0F',
  },
  [arbitrum.id]: {
    olasAddress: '0x064f8b858c2a603e1b106a2039f5446d32dc81c1',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  },
  [optimism.id]: {
    olasAddress: '0xFC2E6e6BCbd49ccf3A5f029c79984372DcBFE527',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  },

  [base.id]: {
    olasAddress: '0x54330d28ca3357F294334BDC454a032e7f353416',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  },
  [celo.id]: {
    olasAddress: '0xaCFfAe8e57Ec6E394Eb1b41939A8CF7892DbDc51',
  },
  // solana
  [VM_TYPE.SVM]: {
    olasAddress: 'Ez3nzG9ofodYCvEmw73XhQ87LWNYVRM2s7diB5tBZPyM',
    balancerVault: '5dMKUYJDsjZkAD3wiV3ViQkuq9pSmWQ5eAzcQLtDnUT3', // whirpool address
    wsolAddress: 'So11111111111111111111111111111111111111112',
  },
};
