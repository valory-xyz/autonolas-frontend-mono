import { render, waitFor } from '@testing-library/react';
import ListServices from '../../../components/ListServices';
import { useServiceInfo } from '../../../components/ListServices/useSvmService';
import { useHelpers } from '../../../common-util/hooks/useHelpers';
import {
  getServices,
  getFilteredServices,
  getTotalForAllServices,
  getTotalForMyServices,
} from '../../../components/ListServices/utils';
import {
  wrapProvider,
  ACTIVE_TAB,
  getTableTd,
  svmConnectivityEmptyMock,
  getTableTh,
  dummyAddress,
  mockSvmAddress,
} from '../../tests-helpers';

jest.mock('../../../components/ListServices/utils', () => ({
  getServices: jest.fn(),
  getFilteredServices: jest.fn(),
  getTotalForAllServices: jest.fn(),
  getTotalForMyServices: jest.fn(),
}));

jest.mock('common-util/hooks/useHelpers', () => ({
  useHelpers: jest.fn(),
}));

jest.mock('common-util/hooks/useSvmConnectivity', () => ({
  useSvmConnectivity: jest.fn(() => svmConnectivityEmptyMock),
}));

jest.mock('../../../components/ListServices/useSvmService', () => ({
  useServiceInfo: jest.fn(),
}));

describe('listServices/index.jsx', () => {
  describe('EVM', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      useHelpers.mockReturnValue({
        account: '0x12345',
        chainName: 'EVM',
        links: { SERVICES: '/services' },
        isSvm: false,
      });
      useServiceInfo.mockReturnValue(jest.fn(() => {}));
      getTotalForAllServices.mockResolvedValue(1);
      getTotalForMyServices.mockResolvedValue(1);
      getServices.mockResolvedValue([
        { id: '1', owner: dummyAddress, state: '5' },
      ]);
      getFilteredServices.mockResolvedValue([
        { id: '2', owner: dummyAddress, state: '2' },
      ]);
    });

    it('should render tabs with `All Tab` & Mint button', async () => {
      const { container, getByRole } = render(wrapProvider(<ListServices />));
      // check if the selected tab is `All` & has the correct content
      await waitFor(async () => {
        expect(container.querySelector(ACTIVE_TAB).textContent).toBe('All');

        // Mint button
        expect(getByRole('button', { name: 'Mint' })).toBeInTheDocument();
      });
    });

    it('should show search input', async () => {
      const { getByRole } = render(wrapProvider(<ListServices />));
      await waitFor(async () => {
        expect(getByRole('textbox')).toBeInTheDocument();
      });
    });

    it('should render service columns and rows', async () => {
      const { container } = render(wrapProvider(<ListServices />));
      await waitFor(async () => {
        // column names
        expect(container.querySelector(getTableTh(1)).textContent).toBe('ID');
        expect(container.querySelector(getTableTh(2)).textContent).toBe(
          'Owner',
        );
        expect(container.querySelector(getTableTh(3)).textContent).toBe(
          'State',
        );
        expect(container.querySelector(getTableTh(4)).textContent).toBe(
          'Action',
        );

        // rows
        expect(container.querySelector(getTableTd(1)).textContent).toBe('1');
        expect(container.querySelector(getTableTd(2)).textContent).toBe(
          '0x8626...9C1199',
        );
        expect(container.querySelector(getTableTd(3)).textContent).toBe(
          'Terminated Bonded',
        );
        expect(container.querySelector(getTableTd(4)).textContent).toBe('View');
      });
    });
  });

  describe('SVM', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      useHelpers.mockReturnValue({
        account: mockSvmAddress,
        chainName: 'SVM',
        links: { SERVICES: '/services' },
        isSvm: true,
      });
      useServiceInfo.mockReturnValue({
        getTotalForAllSvmServices: jest.fn(() => 1),
        getTotalForMySvmServices: jest.fn(() => 1),
        getSvmServices: jest.fn(() => [
          { id: '1', owner: mockSvmAddress, state: '5' },
        ]),
        getMySvmServices: jest.fn(() => [
          { id: '2', owner: mockSvmAddress, state: '5' },
        ]),
      });

      // below functions are required to be mocked as they are used by EVM
      getTotalForAllServices.mockResolvedValue(0);
      getTotalForMyServices.mockResolvedValue(0);
      getServices.mockResolvedValue([]);
      getFilteredServices.mockResolvedValue([]);
    });

    it('should render tabs with `All Tab` & Mint button', async () => {
      const { container, getByRole } = render(wrapProvider(<ListServices />));
      // check if the selected tab is `All` & has the correct content
      await waitFor(async () => {
        expect(container.querySelector(ACTIVE_TAB).textContent).toBe('All');

        // Mint button
        expect(getByRole('button', { name: 'Mint' })).toBeInTheDocument();
      });
    });

    it('should NOT show search input', async () => {
      const { queryByRole } = render(wrapProvider(<ListServices />));
      await waitFor(async () => {
        expect(queryByRole('textbox')).toBeNull();
      });
    });

    it('should render service columns and rows', async () => {
      const { container } = render(wrapProvider(<ListServices />));
      await waitFor(async () => {
        // column names
        expect(container.querySelector(getTableTh(1)).textContent).toBe('ID');
        expect(container.querySelector(getTableTh(2)).textContent).toBe(
          'Owner',
        );
        expect(container.querySelector(getTableTh(3)).textContent).toBe(
          'State',
        );
        expect(container.querySelector(getTableTh(4)).textContent).toBe(
          'Action',
        );

        // rows
        expect(container.querySelector(getTableTd(1)).textContent).toBe('1');
        expect(container.querySelector(getTableTd(2)).textContent).toBe(
          'DrGvsA...D3Wm5x',
        );
        expect(container.querySelector(getTableTd(3)).textContent).toBe(
          'Terminated Bonded',
        );
        expect(container.querySelector(getTableTd(4)).textContent).toBe('View');
      });
    });
  });
});
