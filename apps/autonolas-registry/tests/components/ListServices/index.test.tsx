import { render, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';

import ListServices from 'components/ListServices';
import { useServiceInfo } from 'components/ListServices/hooks/useSvmService';
import {
  useAllServices,
  useMyServices,
  useSearchServices,
} from 'components/ListServices/hooks/useServicesList';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  getServices,
  getFilteredServices,
  getTotalForAllServices,
  getTotalForMyServices,
} from 'components/ListServices/utils';
import {
  wrapProvider,
  ACTIVE_TAB,
  svmConnectivityEmptyMock,
  dummyAddress,
  mockSvmAddress,
  useHelpersEvmMock,
  useHelpersBaseMock,
  dummyHash1,
  mockCodeUri,
  dummyAddress1,
} from '../../tests-helpers';
import { checkAndGetTabComponent } from '../../tests-helpers/utils';

const allServicesResponse = [
  {
    id: '301',
    serviceId: '301',
    owner: dummyAddress,
    publicId: 'good_package_name_all_services',
    packageHash: dummyHash1,
    metadataHash: mockCodeUri,
    state: 4,
  },
];
const myServicesResponse = [
  {
    ...allServicesResponse[0],
    serviceId: '302',
    owner: dummyAddress1,
    publicId: 'good_package_name_my_services',
    state: 1,
  },
];
const allServicesSearchResponse = [
  {
    ...allServicesResponse[0],
    serviceId: '3',
    publicId: 'good_package_name_services_search',
  },
];

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

jest.mock('components/ListServices/utils', () => ({
  getServices: jest.fn(),
  getFilteredServices: jest.fn(),
  getTotalForAllServices: jest.fn(),
  getTotalForMyServices: jest.fn(),
}));

jest.mock('components/ListServices/hooks/useServicesList', () => ({
  useAllServices: jest.fn(),
  useMyServices: jest.fn(),
  useSearchServices: jest.fn(),
}));

jest.mock('common-util/hooks/useHelpers', () => ({
  useHelpers: jest.fn(),
}));

jest.mock('common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: jest.fn(() => svmConnectivityEmptyMock),
}));

jest.mock('components/ListServices/hooks/useSvmService', () => ({
  useServiceInfo: jest.fn(),
}));

describe('listServices/index.jsx - EVM', () => {
  beforeEach(() => {
    (useAllServices as jest.Mock).mockReturnValue(() => Promise.resolve(allServicesResponse));
    (useMyServices as jest.Mock).mockReturnValue(() => Promise.resolve(myServicesResponse));
    (useSearchServices as jest.Mock).mockReturnValue(() =>
      Promise.resolve(allServicesSearchResponse),
    );

    (useRouter as jest.Mock).mockReturnValue({ query: {}, push: jest.fn() });
    (useHelpers as jest.Mock).mockReturnValue(useHelpersEvmMock);
    (useServiceInfo as jest.Mock).mockReturnValue(jest.fn(() => {}));
  });

  it('should display tabs with `All Tab` & Mint button', async () => {
    const { container, getByRole } = render(wrapProvider(<ListServices />));
    // check if the selected tab is `All` & has the correct content
    await waitFor(async () => {
      expect(container.querySelector(ACTIVE_TAB)?.textContent).toBe('All');

      expect(getByRole('button', { name: 'Mint' })).toBeInTheDocument();
    });
  });

  it('should not have search input if "search" query string is not available', async () => {
    const { findByPlaceholderText } = render(wrapProvider(<ListServices />));

    const searchInput = await findByPlaceholderText('Search...');
    if (!searchInput) throw new Error('Search input not found');
    expect(searchInput).toHaveValue('');
  });

  describe('mainnet', () => {
    beforeEach(() => {
      (getTotalForAllServices as jest.Mock).mockResolvedValue(1);
      (getTotalForMyServices as jest.Mock).mockResolvedValue(1);
    });

    it('should display columns for mainnet', async () => {
      const { container, findByTestId } = render(wrapProvider(<ListServices />));
      const allServicesTable = await findByTestId('all-services-table');

      if (!container) {
        throw new Error('`All tab` is null');
      }

      await waitFor(async () => {
        expect(within(allServicesTable).getByText('ID')).toBeInTheDocument();
        expect(within(allServicesTable).getByText('Name')).toBeInTheDocument();
        expect(within(allServicesTable).getByText('Owner')).toBeInTheDocument();
        expect(within(allServicesTable).getByText('Hash')).toBeInTheDocument();
        expect(within(allServicesTable).getByText('State')).toBeInTheDocument();
        expect(within(allServicesTable).getByText('Action')).toBeInTheDocument();
      });
    });

    it('should display all services information', async () => {
      const { container, findByTestId } = render(wrapProvider(<ListServices />));

      if (!container) {
        throw new Error('`All tab` is null');
      }

      // check if the selected tab is `All` & has the correct content
      await waitFor(async () =>
        expect(container.querySelector(ACTIVE_TAB)?.textContent).toBe('All'),
      );

      const firstService = allServicesResponse[0];
      const allServicesTable = await findByTestId('all-services-table');

      await waitFor(async () => {
        expect(within(allServicesTable).getByText(firstService.serviceId)).toBeInTheDocument();
        expect(within(allServicesTable).getByText(/0x8626...9C1199/)).toBeInTheDocument();
        expect(within(allServicesTable).getByText(/0x9cf4...315ab0/)).toBeInTheDocument();
        expect(within(allServicesTable).getByText(/Deployed/)).toBeInTheDocument();
        expect(within(allServicesTable).getByText(/View/)).toBeInTheDocument();
      });
    });

    describe('Search', () => {
      it('should have search input if "search" query string is available', async () => {
        (useRouter as jest.Mock).mockReturnValue({
          query: { search: 'Random search string' },
          push: jest.fn(),
        });

        const { findByPlaceholderText } = render(wrapProvider(<ListServices />));

        const searchInput = await findByPlaceholderText('Search...');
        if (!searchInput) throw new Error('Search input not found in `All` tab');
        expect(searchInput).toHaveValue('Random search string');
      });
    });
  });

  describe('non-mainnet', () => {
    beforeEach(() => {
      (useHelpers as jest.Mock).mockReturnValue(useHelpersBaseMock);
      (getTotalForAllServices as jest.Mock).mockResolvedValue(1);
      (getTotalForMyServices as jest.Mock).mockResolvedValue(1);
      (getServices as jest.Mock).mockResolvedValue([
        { id: '5001', owner: dummyAddress, state: '5' },
      ]);
    });

    it('should display service columns', async () => {
      const { container, findByTestId } = render(wrapProvider(<ListServices />));
      const allServicesTable = await findByTestId('all-services-table');

      if (!container) {
        throw new Error('`All tab` is null');
      }

      await waitFor(async () => {
        expect(within(allServicesTable).getByText('ID')).toBeInTheDocument();
        expect(within(allServicesTable).queryByText('Name')).toBeNull();
        expect(within(allServicesTable).getByText('Owner')).toBeInTheDocument();
        expect(within(allServicesTable).queryByText('Hash')).toBeNull();
        expect(within(allServicesTable).getByText('State')).toBeInTheDocument();
        expect(within(allServicesTable).getByText('Action')).toBeInTheDocument();
      });
    });

    it('should display all services information', async () => {
      const { container, findByTestId } = render(wrapProvider(<ListServices />));

      if (!container) {
        throw new Error('`All tab` is null');
      }

      // check if the selected tab is `All` & has the correct content
      await waitFor(async () =>
        expect(container.querySelector(ACTIVE_TAB)?.textContent).toBe('All'),
      );

      const allServicesTable = await findByTestId('all-services-table');

      await waitFor(async () => {
        expect(within(allServicesTable).getByText('5001')).toBeInTheDocument();
        expect(within(allServicesTable).getByText(/0x8626...9C1199/)).toBeInTheDocument();
        expect(within(allServicesTable).getByText(/Terminated Bonded/)).toBeInTheDocument();
        expect(within(allServicesTable).getByText(/View/)).toBeInTheDocument();
      });
    });
  });
});

describe('listServices/index.jsx - SVM', () => {
  beforeEach(() => {
    (useAllServices as jest.Mock).mockReturnValue(() => Promise.resolve(allServicesResponse));
    (useMyServices as jest.Mock).mockReturnValue(() => Promise.resolve(myServicesResponse));
    (useSearchServices as jest.Mock).mockReturnValue(() =>
      Promise.resolve(allServicesSearchResponse),
    );

    (useRouter as jest.Mock).mockReturnValue({ query: {}, push: jest.fn() });
    (useHelpers as jest.Mock).mockReturnValue({
      account: mockSvmAddress,
      chainName: 'SVM',
      links: { SERVICES: '/services' },
      isSvm: true,
    });
    (useServiceInfo as jest.Mock).mockReturnValue({
      getTotalForAllSvmServices: jest.fn(() => 1),
      getTotalForMySvmServices: jest.fn(() => 1),
      getSvmServices: jest.fn(() => [{ id: '1', owner: mockSvmAddress, state: '5' }]),
      getMySvmServices: jest.fn(() => [{ id: '2', owner: mockSvmAddress, state: '5' }]),
    });

    // below functions are required to be mocked as they are used by EVM
    (getTotalForAllServices as jest.Mock).mockResolvedValue(0);
    (getTotalForMyServices as jest.Mock).mockResolvedValue(0);
    (getServices as jest.Mock).mockResolvedValue([]);
    (getFilteredServices as jest.Mock).mockResolvedValue([]);
  });

  it('should display tabs with `All Tab` & Mint button', async () => {
    const { container, getByRole } = render(wrapProvider(<ListServices />));

    if (!container) {
      throw new Error('`All tab` is null');
    }

    // check if the selected tab is `All` & has the correct content
    await waitFor(async () => {
      expect(container.querySelector(ACTIVE_TAB)?.textContent).toBe('All');

      expect(getByRole('button', { name: 'Mint' })).toBeInTheDocument();
    });
  });

  it('should NOT show search input', async () => {
    const { queryByRole } = render(wrapProvider(<ListServices />));
    await waitFor(async () => {
      expect(queryByRole('textbox')).toBeNull();
    });
  });

  it('should display service columns and rows', async () => {
    const { container, getByText } = render(wrapProvider(<ListServices />));

    await checkAndGetTabComponent(container, '.ant-tabs-tab:nth-child(1)', 'All');

    await waitFor(async () => {
      // column names
      expect(getByText('ID')).toBeInTheDocument();
      expect(getByText('Owner')).toBeInTheDocument();
      expect(getByText('State')).toBeInTheDocument();
      expect(getByText('Action')).toBeInTheDocument();

      // rows
      expect(getByText(/DrGvsA...D3Wm5x/)).toBeInTheDocument();
      expect(getByText(/Terminated Bonded/)).toBeInTheDocument();
      expect(getByText(/View/)).toBeInTheDocument();
    });
  });
});
