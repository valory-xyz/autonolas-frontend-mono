import { render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';

import ListAgents from 'components/ListAgents';
import {
  getAgents,
  getFilteredAgents,
  getTotalForAllAgents,
  getTotalForMyAgents,
} from 'components/ListAgents/utils';
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

const allAgentsResponse = [
  {
    id: '1',
    tokenId: '1',
    owner: dummyAddress,
    publicId: 'good_package_name_all_agents',
    packageHash: dummyHash1,
    metadataHash: mockCodeUri,
  },
];
const myAgentsResponse = [
  {
    ...allAgentsResponse[0],
    tokenId: '2',
    owner: dummyAddress1,
    publicId: 'good_package_name_my_agents',
  },
];
const allAgentsSearchResponse = [
  {
    ...allAgentsResponse[0],
    tokenId: '3',
    publicId: 'good_package_name_agents_search',
  },
];

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

jest.mock('components/ListAgents/utils', () => ({
  getAgents: jest.fn(),
  getFilteredAgents: jest.fn(),
  getTotalForAllAgents: jest.fn(),
  getTotalForMyAgents: jest.fn(),
}));

jest.mock('components/ListAgents/useAgentsList', () => ({
  useAllAgents: () => () => Promise.resolve(allAgentsResponse),
  useMyAgents: () => () => Promise.resolve(myAgentsResponse),
  useSearchAgents: () => () => Promise.resolve(allAgentsSearchResponse),
}));

jest.mock('common-util/hooks/useHelpers', () => ({
  useHelpers: () => useHelpersEvmMock,
}));

jest.mock('common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: () => svmConnectivityEmptyMock,
}));

describe('listAgents/index.jsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({ query: {}, push: jest.fn() });
    (getAgents as jest.Mock).mockResolvedValue(allAgentsResponse);
    (getFilteredAgents as jest.Mock).mockResolvedValue(myAgentsResponse);
    (getTotalForAllAgents as jest.Mock).mockResolvedValue(1);
    (getTotalForMyAgents as jest.Mock).mockResolvedValue(1);
  });

  it('should display the column names', async () => {
    const { container, findByTestId } = render(wrapProvider(<ListAgents />));

    if (!container) {
      throw new Error('`All tab` is null');
    }

    const allAgentsTable = await findByTestId('all-agents-table');

    await waitFor(async () => {
      expect(within(allAgentsTable).getByText('ID')).toBeInTheDocument();
      expect(within(allAgentsTable).getByText('Name')).toBeInTheDocument();
      expect(within(allAgentsTable).getByText('Owner')).toBeInTheDocument();
      expect(within(allAgentsTable).getByText('Hash')).toBeInTheDocument();
      expect(within(allAgentsTable).getByText('Action')).toBeInTheDocument();
    });
  });

  it('should display mint button', async () => {
    const { findByRole } = render(wrapProvider(<ListAgents />));

    expect(await findByRole('button', { name: 'Add Agent Blueprint' })).toBeInTheDocument();
  });

  it('should not have search input if "search" query string is not available', async () => {
    const { findByPlaceholderText } = render(wrapProvider(<ListAgents />));

    const searchInput = await findByPlaceholderText('Search...');
    if (!searchInput) throw new Error('Search input not found');
    expect(searchInput).toHaveValue('');
  });

  describe('All Agents', () => {
    it('should display all agents without search', async () => {
      const { container, findByTestId } = render(wrapProvider(<ListAgents />));

      await checkAndGetTabComponent(container, '.ant-tabs-tab:nth-child(1)', 'All');

      const firstAgent = allAgentsResponse[0];
      const allAgentsTable = await findByTestId('all-agents-table');

      expect(within(allAgentsTable).getByText(firstAgent.tokenId)).toBeInTheDocument();
      expect(within(allAgentsTable).getByText(/0x8626...9C1199/)).toBeInTheDocument();
      expect(within(allAgentsTable).getByText(/0x9cf4...315ab0/)).toBeInTheDocument();
      expect(within(allAgentsTable).getByText(firstAgent.publicId)).toBeInTheDocument();
      expect(within(allAgentsTable).getByText('View')).toBeInTheDocument();
    });

    it('should display all agents search', async () => {
      const { container, getByRole, findByTestId, getByPlaceholderText } = render(
        wrapProvider(<ListAgents />),
      );

      await checkAndGetTabComponent(container, '.ant-tabs-tab:nth-child(1)', 'All');

      const searchInput = getByPlaceholderText('Search...');
      await userEvent.type(searchInput, '!');

      const searchButton = getByRole('button', { name: 'Search' });
      await userEvent.click(searchButton);

      const firstAgent = allAgentsSearchResponse[0];
      const allAgentsTable = await findByTestId('all-agents-table');

      expect(within(allAgentsTable).getByText(firstAgent.tokenId)).toBeInTheDocument();
      expect(within(allAgentsTable).getByText(/0x8626...9C1199/)).toBeInTheDocument();
      expect(within(allAgentsTable).getByText(/0x9cf4...315ab0/)).toBeInTheDocument();
      expect(within(allAgentsTable).getByText(firstAgent.publicId)).toBeInTheDocument();
      expect(within(allAgentsTable).getByText('View')).toBeInTheDocument();
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
        const { findByPlaceholderText } = render(wrapProvider(<ListAgents />));

        const searchInput = await findByPlaceholderText('Search...');
        if (!searchInput) throw new Error('Search input not found in `All` tab');
        expect(searchInput).toHaveValue('Random search string');
      });
    });
  });

  describe('My Agents', () => {
    it('should display my agents', async () => {
      const { container, findByTestId } = render(wrapProvider(<ListAgents />));

      await checkAndGetTabComponent(container, '.ant-tabs-tab:nth-child(2)', 'My Agents');

      const firstAgent = myAgentsResponse[0];
      const myAgentsTable = await findByTestId('my-agents-table');

      expect(within(myAgentsTable).getByText(firstAgent.tokenId)).toBeInTheDocument();
      expect(within(myAgentsTable).getByText(/0x8626...9C1000/)).toBeInTheDocument();
      expect(within(myAgentsTable).getByText(/0x9cf4...315ab0/)).toBeInTheDocument();
      expect(within(myAgentsTable).getByText(firstAgent.publicId)).toBeInTheDocument();
      expect(within(myAgentsTable).getByText('View')).toBeInTheDocument();
    });

    it('should display my agents search', async () => {
      const { container, getByRole, findByTestId, getByPlaceholderText } = render(
        wrapProvider(<ListAgents />),
      );

      const myAgentsTab = await checkAndGetTabComponent(
        container,
        '.ant-tabs-tab:nth-child(2)',
        'My Agents',
      );

      // click the `My agents` tab
      await userEvent.click(myAgentsTab);

      const searchInput = getByPlaceholderText('Search...');
      await userEvent.type(searchInput, '!');

      const searchButton = getByRole('button', { name: 'Search' });
      await userEvent.click(searchButton);

      const firstAgent = allAgentsSearchResponse[0];
      const myAgentsTable = await findByTestId('my-agents-table');

      expect(within(myAgentsTable).getByText(firstAgent.tokenId)).toBeInTheDocument();
      expect(within(myAgentsTable).getByText(/0x8626...9C1199/)).toBeInTheDocument();
      expect(within(myAgentsTable).getByText(/0x9cf4...315ab0/)).toBeInTheDocument();
      expect(within(myAgentsTable).getByText(firstAgent.publicId)).toBeInTheDocument();
      expect(within(myAgentsTable).getByText('View')).toBeInTheDocument();
    });

    describe('Search', () => {
      beforeEach(() => {
        jest.clearAllMocks();

        (useRouter as jest.Mock).mockReturnValue({
          query: { search: 'Random search string', tab: 'my-agents' },
          push: jest.fn(),
        });
      });

      it('should switch to `My Agents` tab if `tab` query is available and `search` query is available', async () => {
        const { container, findByPlaceholderText } = render(wrapProvider(<ListAgents />));

        await checkAndGetTabComponent(container, '.ant-tabs-tab:nth-child(2)', 'My Agents');

        const searchInput = await findByPlaceholderText('Search...');
        if (!searchInput) throw new Error('Search input not found in `My Agents` tab');

        expect(searchInput).toHaveValue('Random search string');
      });
    });
  });
});
