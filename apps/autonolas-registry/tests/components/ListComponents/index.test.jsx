import { within, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import ListComponents from '../../../components/ListComponents';
import {
  getComponents,
  getFilteredComponents,
  getTotalForAllComponents,
  getTotalForMyComponents,
} from '../../../components/ListComponents/utils';
import {
  wrapProvider,
  ACTIVE_TAB,
  svmConnectivityEmptyMock,
  useHelpersEvmMock,
  mockCodeUri,
  dummyAddress,
  dummyHash1,
  dummyAddress1,
} from '../../tests-helpers';

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


jest.mock('../../../components/ListComponents/utils', () => ({
  getComponents: jest.fn(),
  getFilteredComponents: jest.fn(),
  getTotalForAllComponents: jest.fn(),
  getTotalForMyComponents: jest.fn(),
}));

jest.mock('../../../components/ListComponents/useComponents', () => ({
  useAllComponents: () => () => Promise.resolve(allComponentsResponse),
  useMyComponents: () => () => Promise.resolve(myComponentsResponse),
  useSearchComponents: () => () => Promise.resolve(allComponentsSearchResponse),
}));

jest.mock('../../../common-util/hooks/useHelpers', () => ({
  useHelpers: () => useHelpersEvmMock,
}));

jest.mock('../../../common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: () => svmConnectivityEmptyMock,
}));

describe.skip('listComponents/index.jsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getComponents.mockResolvedValue(allComponentsResponse);
    getFilteredComponents.mockResolvedValue(myComponentsResponse);
    getTotalForAllComponents.mockResolvedValue(1);
    getTotalForMyComponents.mockResolvedValue(1);
  });

  it('should display the column names', async () => {
    const { container, findByTestId } = render(
      wrapProvider(<ListComponents />),
    );

    if (!container) {
      throw new Error('`All tab` is null');
    }

    const allComponentsTable = await findByTestId('all-components-table');

    await waitFor(async () => {
      expect(within(allComponentsTable).getByText('ID')).toBeInTheDocument();
      expect(within(allComponentsTable).getByText('Owner')).toBeInTheDocument();
      expect(within(allComponentsTable).getByText('Hash')).toBeInTheDocument();
      expect(
        within(allComponentsTable).getByText('Package Name'),
      ).toBeInTheDocument();
      expect(within(allComponentsTable).getByText('Action')).toBeInTheDocument();
    });
  });

  it('should display mint button', async () => {
    const { getByRole } = render(wrapProvider(<ListComponents />));

    expect(getByRole('button', { name: 'Mint' })).toBeInTheDocument();
  });

  describe('All Components', () => {
    it('should display all components', async () => {
      const { container, findByTestId } = render(
        wrapProvider(<ListComponents />),
      );

      if (!container) {
        throw new Error('`All tab` is null');
      }

      // check if the selected tab is `All` & has the correct content
      await waitFor(async () =>
        expect(container.querySelector(ACTIVE_TAB)?.textContent).toBe('All'),
      );

      const firstAgent = allComponentsResponse[0];

      expect(
        within(await findByTestId('agent-table')).getByText(firstAgent.tokenId),
      ).toBeInTheDocument();
      expect(
        within(await findByTestId('agent-table')).getByText(/0x8626...9C1199/),
      ).toBeInTheDocument();
      expect(
        within(await findByTestId('agent-table')).getByText(/0x9cf4...315ab0/),
      ).toBeInTheDocument();
      expect(
        within(await findByTestId('agent-table')).getByText(
          firstAgent.publicId,
        ),
      ).toBeInTheDocument();
      expect(
        within(await findByTestId('agent-table')).getByText('View'),
      ).toBeInTheDocument();
    });

    it('should display all components search', async () => {
      const { container, getByRole, findByTestId, getByPlaceholderText } =
        render(wrapProvider(<ListComponents />));

      if (!container) {
        throw new Error('`All tab` is null');
      }

      const searchInput = getByPlaceholderText('Search...');
      await userEvent.type(searchInput, '!');

      const searchButton = getByRole('button', { name: 'Search' });
      await userEvent.click(searchButton);

      const firstAgent = allComponentsSearchResponse[0];

      expect(
        within(await findByTestId('agent-table')).getByText(firstAgent.tokenId),
      ).toBeInTheDocument();
      expect(
        within(await findByTestId('agent-table')).getByText(/0x8626...9C1199/),
      ).toBeInTheDocument();
      expect(
        within(await findByTestId('agent-table')).getByText(/0x9cf4...315ab0/),
      ).toBeInTheDocument();
      expect(
        within(await findByTestId('agent-table')).getByText(
          firstAgent.publicId,
        ),
      ).toBeInTheDocument();
      expect(
        within(await findByTestId('agent-table')).getByText('View'),
      ).toBeInTheDocument();
    });
  });

  describe('My Components', () => {
    it('should display mint button', async () => {
      const { findByRole } = render(wrapProvider(<ListComponents />));

      expect(await findByRole('button', { name: 'Mint' })).toBeInTheDocument();
    });
  });
});
