import { getAgentContract } from '../../../common-util/Contracts';
import { getAgents, getFilteredAgents } from '../../../components/ListAgents/utils';
import { dummyAddress } from '../../tests-helpers';

const AGENT_1 = { name: 'Agent One' };

jest.mock('../../../common-util/Contracts', () => ({
  getAgentContract: jest.fn(),
}));

// TODO: mock updateAgentHashes instead
jest.mock('libs/util-constants/src', () => ({
  TOKENOMICS_UNIT_TYPES: { COMPONENT: '0', AGENT: '1' },
}));

describe('listAgents/utils.jsx', () => {
  it('getFilteredAgents: Promise resolved', async () => {
    getAgentContract.mockImplementation(() => ({
      methods: {
        totalSupply: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(1)),
        })),
        balanceOf: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(1)),
        })),
        getUnit: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(AGENT_1)),
        })),
        ownerOf: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(dummyAddress)),
        })),
      },
    }));

    const result = await getFilteredAgents(dummyAddress);
    expect(result).toMatchObject([AGENT_1]);
  });

  it('getAgents: Promise resolved', async () => {
    getAgentContract.mockImplementation(() => ({
      methods: {
        totalSupply: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(1)),
        })),
        getUnit: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(AGENT_1)),
        })),
        ownerOf: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve(dummyAddress)),
        })),
      },
    }));

    const result = await getAgents(1, 1);
    expect(result).toMatchObject([AGENT_1]);
  });
});
