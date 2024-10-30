import { within, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';

import ListComponents from 'components/ListComponents';
import {
  getComponents,
  getFilteredComponents,
  getTotalForAllComponents,
  getTotalForMyComponents,
} from 'components/ListComponents/utils';
import {
  wrapProvider,
  svmConnectivityEmptyMock,
  useHelpersEvmMock,
  mockCodeUri,
  dummyAddress,
  dummyHash1,
  dummyAddress1,
} from '../../tests-helpers';
import { checkAndGetTabComponent } from '../../tests-helpers/utils';

const allComponentsResponse = [
  {
    id: '1',
    tokenId: '1',
    owner: dummyAddress,
    publicId: 'good_package_name_all_components',
    packageHash: dummyHash1,
    metadataHash: mockCodeUri,
  },
];
const myComponentsResponse = [
  {
    ...allComponentsResponse[0],
    tokenId: '2',
    owner: dummyAddress1,
    publicId: 'good_package_name_my_components',
  },
];
const allComponentsSearchResponse = [
  {
    ...allComponentsResponse[0],
    tokenId: '3',
    publicId: 'good_package_name_components_search',
  },
];

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

jest.mock('components/ListComponents/utils', () => ({
  getComponents: jest.fn(),
  getFilteredComponents: jest.fn(),
  getTotalForAllComponents: jest.fn(),
  getTotalForMyComponents: jest.fn(),
}));

jest.mock('components/ListComponents/useComponentsList', () => ({
  useAllComponents: () => () => Promise.resolve(allComponentsResponse),
  useMyComponents: () => () => Promise.resolve(myComponentsResponse),
  useSearchComponents: () => () => Promise.resolve(allComponentsSearchResponse),
}));

jest.mock('common-util/hooks/useHelpers', () => ({
  useHelpers: () => useHelpersEvmMock,
}));

jest.mock('common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: () => svmConnectivityEmptyMock,
}));

describe('listComponents/index.jsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({ query: {}, push: jest.fn() });
    (getComponents as jest.Mock).mockResolvedValue(allComponentsResponse);
    (getFilteredComponents as jest.Mock).mockResolvedValue(myComponentsResponse);
    (getTotalForAllComponents as jest.Mock).mockResolvedValue(1);
    (getTotalForMyComponents as jest.Mock).mockResolvedValue(1);
  });

  it('should display the column names', async () => {
    const { container, findByTestId } = render(wrapProvider(<ListComponents />));

    if (!container) {
      throw new Error('`All tab` is null');
    }

    const allComponentsTable = await findByTestId('all-components-table');

    await waitFor(async () => {
      expect(within(allComponentsTable).getByText('ID')).toBeInTheDocument();
      expect(within(allComponentsTable).getByText('Owner')).toBeInTheDocument();
      expect(within(allComponentsTable).getByText('Hash')).toBeInTheDocument();
      expect(within(allComponentsTable).getByText('Name')).toBeInTheDocument();
      expect(within(allComponentsTable).getByText('Action')).toBeInTheDocument();
    });
  });

  it('should display mint button', async () => {
    const { findByRole } = render(wrapProvider(<ListComponents />));

    expect(await findByRole('button', { name: 'Mint' })).toBeInTheDocument();
  });

  it('should not have search input if "search" query string is not available', async () => {
    const { findByPlaceholderText } = render(wrapProvider(<ListComponents />));

    const searchInput = await findByPlaceholderText('Search...');
    if (!searchInput) throw new Error('Search input not found');
    expect(searchInput).toHaveValue('');
  });

  describe('All Components', () => {
    it('should display all components', async () => {
      const { container, findByTestId } = render(wrapProvider(<ListComponents />));

      await checkAndGetTabComponent(container, '.ant-tabs-tab:nth-child(1)', 'All');

      const firstComponent = allComponentsResponse[0];
      const allComponentsTable = await findByTestId('all-components-table');

      expect(within(allComponentsTable).getByText(firstComponent.tokenId)).toBeInTheDocument();
      expect(within(allComponentsTable).getByText(/0x8626...9C1199/)).toBeInTheDocument();
      expect(within(allComponentsTable).getByText(/0x9cf4...315ab0/)).toBeInTheDocument();
      expect(within(allComponentsTable).getByText(firstComponent.publicId)).toBeInTheDocument();
      expect(within(allComponentsTable).getByText('View')).toBeInTheDocument();
    });

    it('should display all components search', async () => {
      const { container, getByRole, findByTestId, getByPlaceholderText } = render(
        wrapProvider(<ListComponents />),
      );

      await checkAndGetTabComponent(container, '.ant-tabs-tab:nth-child(1)', 'All');

      const searchInput = getByPlaceholderText('Search...');
      await userEvent.type(searchInput, '!');

      const searchButton = getByRole('button', { name: 'Search' });
      await userEvent.click(searchButton);

      const firstComponent = allComponentsSearchResponse[0];
      const allComponentsTable = await findByTestId('all-components-table');

      expect(within(allComponentsTable).getByText(firstComponent.tokenId)).toBeInTheDocument();
      expect(within(allComponentsTable).getByText(/0x8626...9C1199/)).toBeInTheDocument();
      expect(within(allComponentsTable).getByText(/0x9cf4...315ab0/)).toBeInTheDocument();
      expect(within(allComponentsTable).getByText(firstComponent.publicId)).toBeInTheDocument();
      expect(within(allComponentsTable).getByText('View')).toBeInTheDocument();
    });

    describe('Search', () => {
      beforeEach(() => {
        jest.clearAllMocks();

        (useRouter as jest.Mock).mockReturnValue({
          query: { search: 'Random search string' },
          push: jest.fn(),
        });
      });

      it('should have search input if "search" query string is available', async () => {
        const { findByPlaceholderText } = render(wrapProvider(<ListComponents />));

        const searchInput = await findByPlaceholderText('Search...');
        if (!searchInput) throw new Error('Search input not found in `All` tab');
        expect(searchInput).toHaveValue('Random search string');
      });
    });
  });

  describe('My Components', () => {
    it('should display my components', async () => {
      const { container, findByTestId } = render(wrapProvider(<ListComponents />));

      await checkAndGetTabComponent(container, '.ant-tabs-tab:nth-child(2)', 'My Components');

      const firstComponent = myComponentsResponse[0];
      const myComponentsTable = await findByTestId('my-components-table');

      expect(within(myComponentsTable).getByText(firstComponent.tokenId)).toBeInTheDocument();
      expect(within(myComponentsTable).getByText(/0x8626...9C1000/)).toBeInTheDocument();
      expect(within(myComponentsTable).getByText(/0x9cf4...315ab0/)).toBeInTheDocument();
      expect(within(myComponentsTable).getByText(firstComponent.publicId)).toBeInTheDocument();
      expect(within(myComponentsTable).getByText('View')).toBeInTheDocument();
    });

    it('should display my components search', async () => {
      const { container, getByRole, findByTestId, getByPlaceholderText } = render(
        wrapProvider(<ListComponents />),
      );

      await checkAndGetTabComponent(container, '.ant-tabs-tab:nth-child(2)', 'My Components');

      const searchInput = getByPlaceholderText('Search...');
      await userEvent.type(searchInput, '!');

      const searchButton = getByRole('button', { name: 'Search' });
      await userEvent.click(searchButton);

      const firstComponent = allComponentsSearchResponse[0];
      const myComponentsTable = await findByTestId('my-components-table');

      expect(within(myComponentsTable).getByText(firstComponent.tokenId)).toBeInTheDocument();
      expect(within(myComponentsTable).getByText(/0x8626...9C1199/)).toBeInTheDocument();
      expect(within(myComponentsTable).getByText(/0x9cf4...315ab0/)).toBeInTheDocument();
      expect(within(myComponentsTable).getByText(firstComponent.publicId)).toBeInTheDocument();
      expect(within(myComponentsTable).getByText('View')).toBeInTheDocument();
    });

    describe('Search', () => {
      beforeEach(() => {
        jest.clearAllMocks();

        (useRouter as jest.Mock).mockReturnValue({
          query: { search: 'Random search string', tab: 'my-components' },
          push: jest.fn(),
        });
      });

      it('should switch to `My Components` tab if `tab` query is available and `search` query is available', async () => {
        const { container, findByPlaceholderText } = render(wrapProvider(<ListComponents />));

        await checkAndGetTabComponent(container, '.ant-tabs-tab:nth-child(2)', 'My Components');

        const searchInput = await findByPlaceholderText('Search...');
        if (!searchInput) throw new Error('Search input not found in `My Components` tab');

        expect(searchInput).toHaveValue('Random search string');
      });
    });
  });
});
