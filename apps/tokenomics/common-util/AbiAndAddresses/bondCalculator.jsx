export const BOND_CALCULATOR = {
  contractName: 'GenericBondCalculator',
  addresses: {
    1: '0x1521918961bDBC9Ed4C67a7103D5999e4130E6CB',
    5: '0x77290FF625fc576f465D0256F6a12Ce4480a5b8a',
  },
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_olas',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_tokenomics',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'provided',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'max',
          type: 'uint256',
        },
      ],
      name: 'Overflow',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'x',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'y',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'denominator',
          type: 'uint256',
        },
      ],
      name: 'PRBMath_MulDiv_Overflow',
      type: 'error',
    },
    {
      inputs: [],
      name: 'ZeroAddress',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tokenAmount',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'priceLP',
          type: 'uint256',
        },
      ],
      name: 'calculatePayoutOLAS',
      outputs: [
        {
          internalType: 'uint256',
          name: 'amountOLAS',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
      ],
      name: 'getCurrentPriceLP',
      outputs: [
        {
          internalType: 'uint256',
          name: 'priceLP',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'olas',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'tokenomics',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
};
