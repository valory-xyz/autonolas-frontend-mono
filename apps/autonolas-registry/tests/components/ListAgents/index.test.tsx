import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import ListAgents from '../../../components/ListAgents';
import {
  getAgents,
  getFilteredAgents,
  getTotalForAllAgents,
  getTotalForMyAgents,
} from '../../../components/ListAgents/utils';
import { useRouter } from 'next/router';
import { wrapProvider, ACTIVE_TAB, getTableTd } from '../../helpers';

jest.mock('../../../components/ListAgents/utils', () => ({
  getAgents: jest.fn(),
  getFilteredAgents: jest.fn(),
  getTotalForAllAgents: jest.fn(),
  getTotalForMyAgents: jest.fn(),
}));

// dummy responses mock
const allAgentsResponse = { id: '1', dependencies: ['4'] };
const myAgentsResponse = { id: '2', dependencies: ['5'] };


describe('listAgents/index.jsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockImplementation(() => ({ push: jest.fn() }));
    (getAgents as jest.Mock).mockResolvedValue([allAgentsResponse]);
    (getFilteredAgents as jest.Mock).mockResolvedValue([myAgentsResponse]);
    (getTotalForAllAgents as jest.Mock).mockResolvedValue(1);
    (getTotalForMyAgents as jest.Mock).mockResolvedValue(1);
  });

  it('should render tabs with `All Tab` as active tab & Mint button', async () => {
    expect.hasAssertions();
    const { container, getByRole } = render(wrapProvider(<ListAgents />));

    if(!container) {
      throw new Error('`All tab` is null');
    }

    // check if the selected tab is `All` & has the correct content
    await waitFor(async () => expect(container.querySelector(ACTIVE_TAB)?.textContent).toBe('All'));

    await waitFor(async () => {
      // ckecking Id, description column
      expect(container.querySelector(getTableTd(1))?.textContent).toBe('1');
      expect(container.querySelector(getTableTd(4))?.textContent).toBe(
        allAgentsResponse.dependencies.length.toString(),
      );
      expect(getByRole('button', { name: 'View' })).toBeInTheDocument();

      // it should be called once
      // expect(useRouter).toHaveBeenCalledTimes(1);

      // Mint button
      expect(getByRole('button', { name: 'Mint' })).toBeInTheDocument();
    });
  });

  it('should render tabs with `My Agents` as active tab & Mint button', async () => {
    expect.hasAssertions();
    const { container, getByRole } = render(wrapProvider(<ListAgents />));
    if(!container) {
      throw new Error('`My agents` is null');
    }

    const myAgentsTab = container.querySelector('.ant-tabs-tab:nth-child(2)');
    if(!myAgentsTab) {
      throw new Error('`My agents` tab is null');
    }

    // click the `My agents` tab
    userEvent.click(myAgentsTab);

    // check if the selected tab is `My agents` & has the correct content
    await waitFor(async () => {
      expect(container.querySelector(ACTIVE_TAB)?.textContent).toBe('My Agents');
    });

    // Mint button
    expect(getByRole('button', { name: 'Mint' })).toBeInTheDocument();
  });
});
