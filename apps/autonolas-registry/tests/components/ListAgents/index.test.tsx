import { render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import ListAgents from '../../../components/ListAgents';
import {
  getAgents,
  getFilteredAgents,
  getTotalForAllAgents,
  getTotalForMyAgents,
} from '../../../components/ListAgents/utils';
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

jest.mock('../../../components/ListAgents/utils', () => ({
  getAgents: jest.fn(),
  getFilteredAgents: jest.fn(),
  getTotalForAllAgents: jest.fn(),
  getTotalForMyAgents: jest.fn(),
}));

jest.mock('../../../components/ListAgents/useAgents', () => ({
  useAllAgents: () => () => Promise.resolve(allAgentsResponse),
  useMyAgents: () => () => Promise.resolve(myAgentsResponse),
  useSearchAgents: () => () => Promise.resolve(allAgentsSearchResponse),
}));

jest.mock('../../../common-util/hooks/useHelpers', () => ({
  useHelpers: () => useHelpersEvmMock,
}));

jest.mock('../../../common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: () => svmConnectivityEmptyMock,
}));

describe('listAgents/index.jsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(
        within(allAgentsTable).getByText('Name'),
      ).toBeInTheDocument();
      expect(within(allAgentsTable).getByText('Owner')).toBeInTheDocument();
      expect(within(allAgentsTable).getByText('Hash')).toBeInTheDocument();
      expect(within(allAgentsTable).getByText('Action')).toBeInTheDocument();
    });
  });

  it('should display mint button', async () => {
    const { findByRole } = render(wrapProvider(<ListAgents />));

    expect(await findByRole('button', { name: 'Mint' })).toBeInTheDocument();
  });

  describe('All Agents', () => {
    it('should display all agents', async () => {
      const { container, findByTestId } = render(wrapProvider(<ListAgents />));

      if (!container) {
        throw new Error('`All tab` is null');
      }

      // check if the selected tab is `All` & has the correct content
      await waitFor(async () =>
        expect(container.querySelector(ACTIVE_TAB)?.textContent).toBe('All'),
      );

      const firstAgent = allAgentsResponse[0];
      const allAgentsTable = await findByTestId('all-agents-table');

      expect(
        within(allAgentsTable).getByText(firstAgent.tokenId),
      ).toBeInTheDocument();
      expect(
        within(allAgentsTable).getByText(/0x8626...9C1199/),
      ).toBeInTheDocument();
      expect(
        within(allAgentsTable).getByText(/0x9cf4...315ab0/),
      ).toBeInTheDocument();
      expect(
        within(allAgentsTable).getByText(firstAgent.publicId),
      ).toBeInTheDocument();
      expect(within(allAgentsTable).getByText('View')).toBeInTheDocument();
    });

    it('should display all agents search', async () => {
      const { container, getByRole, findByTestId, getByPlaceholderText } =
        render(wrapProvider(<ListAgents />));

      if (!container) {
        throw new Error('`All tab` is null');
      }

      const searchInput = getByPlaceholderText('Search...');
      await userEvent.type(searchInput, '!');

      const searchButton = getByRole('button', { name: 'Search' });
      await userEvent.click(searchButton);

      const firstAgent = allAgentsSearchResponse[0];
      const allAgentsTable = await findByTestId('all-agents-table');

      expect(
        within(allAgentsTable).getByText(firstAgent.tokenId),
      ).toBeInTheDocument();
      expect(
        within(allAgentsTable).getByText(/0x8626...9C1199/),
      ).toBeInTheDocument();
      expect(
        within(allAgentsTable).getByText(/0x9cf4...315ab0/),
      ).toBeInTheDocument();
      expect(
        within(allAgentsTable).getByText(firstAgent.publicId),
      ).toBeInTheDocument();
      expect(within(allAgentsTable).getByText('View')).toBeInTheDocument();
    });
  });

  describe('My Agents', () => {
    it('should display my agents', async () => {
      const { container, findByTestId } = render(wrapProvider(<ListAgents />));

      const myAgentsTab = container.querySelector('.ant-tabs-tab:nth-child(2)');
      if (!myAgentsTab) {
        throw new Error('`My agents` tab is null');
      }

      // click the `My agents` tab
      await userEvent.click(myAgentsTab);

      // check if the selected tab is `My` & has the correct content
      await waitFor(async () =>
        expect(container.querySelector(ACTIVE_TAB)?.textContent).toBe(
          'My Agents',
        ),
      );

      const firstAgent = myAgentsResponse[0];
      const myAgentsTable = await findByTestId('my-agents-table');

      expect(
        within(myAgentsTable).getByText(firstAgent.tokenId),
      ).toBeInTheDocument();
      expect(
        within(myAgentsTable).getByText(/0x8626...9C1000/),
      ).toBeInTheDocument();
      expect(
        within(myAgentsTable).getByText(/0x9cf4...315ab0/),
      ).toBeInTheDocument();
      expect(
        within(myAgentsTable).getByText(firstAgent.publicId),
      ).toBeInTheDocument();
      expect(within(myAgentsTable).getByText('View')).toBeInTheDocument();
    });

    it('should display my agents search', async () => {
      const { container, getByRole, findByTestId, getByPlaceholderText } =
        render(wrapProvider(<ListAgents />));

      const myAgentsTab = container.querySelector('.ant-tabs-tab:nth-child(2)');
      if (!myAgentsTab) {
        throw new Error('`My agents` tab is null');
      }

      // click the `My agents` tab
      await userEvent.click(myAgentsTab);

      const searchInput = getByPlaceholderText('Search...');
      await userEvent.type(searchInput, '!');

      const searchButton = getByRole('button', { name: 'Search' });
      await userEvent.click(searchButton);

      const firstAgent = allAgentsSearchResponse[0];
      const myAgentsTable = await findByTestId('my-agents-table');

      expect(
        within(myAgentsTable).getByText(firstAgent.tokenId),
      ).toBeInTheDocument();
      expect(
        within(myAgentsTable).getByText(/0x8626...9C1199/),
      ).toBeInTheDocument();
      expect(
        within(myAgentsTable).getByText(/0x9cf4...315ab0/),
      ).toBeInTheDocument();
      expect(
        within(myAgentsTable).getByText(firstAgent.publicId),
      ).toBeInTheDocument();
      expect(within(myAgentsTable).getByText('View')).toBeInTheDocument();
    });
  });
});
