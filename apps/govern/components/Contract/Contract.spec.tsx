import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ContractPage } from './Contract';

jest.mock('next/router', () => {
  return {
    useRouter: jest.fn().mockReturnValue({
      query: { address: '0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3' },
    }),
  };
});

jest.mock('store/index', () => ({
  useAppSelector: jest.fn().mockReturnValue({
    isStakingContractsLoading: false,
    stakingContracts: [
      {
        address: '0x0000000000000000000000007248d855a3d4d17c32eb0d996a528f7520d2f4a3',
        chainId: 1,
        metadata: {
          name: 'Staking Contract Name 1',
          description: 'Some good contract description.',
        },
      },
    ],
  }),
}));

jest.mock('hooks/index', () => ({
  useContractParams: jest.fn().mockReturnValue({
    data: {
      implementation: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      deployer: '0xdddddddddddddddddddddddddddddddddddddddd',
      isEnabled: true,
    },
  }),
}));

jest.mock('wagmi', () => ({
  useEnsName: jest.fn().mockReturnValue({ data: null }),
}));

describe('<ContractPage />', () => {
  it('should display contract name and description', () => {
    render(<ContractPage />);

    expect(screen.getByText(/Staking Contract Name 1/)).toBeInTheDocument();
    expect(screen.getByText(/Some good contract description./)).toBeInTheDocument();
  });

  it('should display contract owner address', () => {
    render(<ContractPage />);

    expect(screen.getByText(/Owner address/)).toBeInTheDocument();
    expect(screen.getByText(/0xddddd...ddddd ↗/)).toBeInTheDocument();
    expect(screen.getByTestId('owner-address').getAttribute('href')).toBe(
      'https://etherscan.io/address/0xdddddddddddddddddddddddddddddddddddddddd',
    );
  });

  it('should display contract chain name', () => {
    render(<ContractPage />);

    expect(screen.getByText(/Chain/)).toBeInTheDocument();
    expect(screen.getByText(/Ethereum/)).toBeInTheDocument();
  });

  it('should display contract address', () => {
    render(<ContractPage />);

    expect(screen.getByText(/Contract address/)).toBeInTheDocument();
    expect(screen.getByText(/0x7248d...2f4a3 ↗/)).toBeInTheDocument();
    expect(screen.getByTestId('contract-address').getAttribute('href')).toBe(
      'https://etherscan.io/address/0x7248d855a3d4d17c32eb0d996a528f7520d2f4a3',
    );
  });
});
