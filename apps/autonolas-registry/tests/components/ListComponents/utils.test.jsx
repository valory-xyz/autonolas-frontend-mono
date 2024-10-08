import { getComponentContract } from '../../../common-util/Contracts';
import {
  getComponentDetails,
  getComponents,
  getFilteredComponents,
} from '../../../components/ListComponents/utils';
import { dummyAddress } from '../../tests-helpers';

const COMPONENT_1 = { name: 'Component One' };

jest.mock('../../../common-util/Contracts', () => ({
  getComponentContract: jest.fn(),
}));

// TODO: mock updateComponentHashes instead
jest.mock('libs/util-constants/src', () => ({
  TOKENOMICS_UNIT_TYPES: { COMPONENT: '0', AGENT: '1' },
}));

describe('listComponents/utils.jsx', () => {
  it('getComponentDetails: Promise resolved', async () => {
    getComponentContract.mockImplementation(() => ({
      methods: {
        getUnit: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(COMPONENT_1)),
        })),
      },
    }));

    const result = await getComponentDetails();
    expect(result).toMatchObject(COMPONENT_1);
  });

  it('getFilteredComponents: Promise resolved', async () => {
    getComponentContract.mockImplementation(() => ({
      methods: {
        totalSupply: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(1)),
        })),
        balanceOf: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(1)),
        })),
        getUnit: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(COMPONENT_1)),
        })),
        ownerOf: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(dummyAddress)),
        })),
      },
    }));

    const result = await getFilteredComponents(dummyAddress);
    expect(result).toMatchObject([COMPONENT_1]);
  });

  it('getComponents: Promise resolved', async () => {
    getComponentContract.mockImplementation(() => ({
      methods: {
        totalSupply: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(1)),
        })),
        getUnit: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(COMPONENT_1)),
        })),
        ownerOf: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(dummyAddress)),
        })),
      },
    }));

    const result = await getComponents(1, 1);
    expect(result).toMatchObject([COMPONENT_1]);
  });
});
