import type { NextApiRequest, NextApiResponse } from 'next';

import type { MechManifest } from 'common-util/functions/erc8004Kya';

export const CHAIN_ID = 100;
export const NETWORK = 'gnosis';
export const SERVICE_ID = '7';
export const AGENT_ID = 7;
export const GNOSIS_IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
export const CONFIG_HASH = `0x${'aa'.repeat(32)}`;
export const MANIFEST_HASH = `0x${'bb'.repeat(32)}`;
export const MANIFEST_GATEWAY_URL = `https://gateway.autonolas.tech/ipfs/f01701220${'bb'.repeat(32)}`;
export const MECH_ADDRESS = `0x${'22'.repeat(20)}`;
export const AGENT_WALLET = `0x${'33'.repeat(20)}`;
export const OPERATOR_DOMAIN = 'www.valory.xyz';
export const OPERATOR_URL = `https://${OPERATOR_DOMAIN}`;
export const DOMAIN_PROOF_URL = `https://${OPERATOR_DOMAIN}/.well-known/agent-registration.json`;
export const BENCHMARK_URL = `https://mech-analytics-api.autonolas.tech/v1/metrics/mech/${CHAIN_ID}/${MECH_ADDRESS}`;

// keccak256("FixedPriceNative"), as paymentType() returns it.
export const NATIVE_PAYMENT_TYPE =
  '0xba699a34be8fe0e7725e93dcbce1701b0211a8ca61330aaeb8a05bf2ec7abed1';
export const USDC_PAYMENT_TYPE =
  '0x6406bb5f31a732f898e1ce9fdd988a80a808d36ab5d9a4a4805a8be8d197d5e3';
export const UNKNOWN_PAYMENT_TYPE = `0x${'77'.repeat(32)}`;
export const MAX_DELIVERY_RATE_WEI = 10_000_000_000_000_000n;

export const makeManifest = (overrides: Partial<MechManifest> = {}): MechManifest => ({
  name: 'Prediction mech',
  description: 'Predicts market outcomes.',
  inputFormat: 'ipfs-v0.1',
  outputFormat: 'ipfs-v0.1',
  tools: ['prediction-online'],
  toolMetadata: {
    'prediction-online': {
      name: 'prediction-online',
      description: 'Online prediction.',
      input: { type: 'text', description: 'The question.' },
      output: { type: 'text', description: 'The probability.' },
      benchmark: {
        metric: 'accuracy',
        value: 0.83,
        window: '30d',
        url: BENCHMARK_URL,
      },
    },
  },
  operator: {
    name: 'Valory',
    domain: OPERATOR_DOMAIN,
    contact: `contact@${OPERATOR_DOMAIN}`,
  },
  ...overrides,
});

export const makeDomainProof = (
  registrations: Array<{ agentRegistry: string; agentId: number | string }> = [
    {
      agentRegistry: `eip155:${CHAIN_ID}:${GNOSIS_IDENTITY_REGISTRY}`,
      agentId: AGENT_ID,
    },
  ],
) => ({ registrations });

export const makeMarketplaceService = (overrides: Record<string, unknown> = {}) => ({
  id: SERVICE_ID,
  totalRequests: 0,
  totalDeliveries: 3,
  metadata: MANIFEST_HASH,
  mechAddresses: [MECH_ADDRESS],
  ...overrides,
});

export const makeRegistryService = (overrides: Record<string, unknown> = {}) => ({
  id: SERVICE_ID,
  multisig: AGENT_WALLET,
  erc8004Agent: { id: String(AGENT_ID), agentWallet: AGENT_WALLET },
  ...overrides,
});

export type MockRes = {
  status: jest.Mock;
  json: jest.Mock;
  setHeader: jest.Mock;
  headers: Record<string, string>;
};

export const makeRes = (): MockRes => {
  const headers: Record<string, string> = {};
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn((key: string, value: string) => {
      headers[key] = value;
    }),
    headers,
  };
};

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>;

export const callHandler = async (
  handler: Handler,
  query: Record<string, string>,
  method = 'GET',
): Promise<MockRes> => {
  const req = { method, query } as unknown as NextApiRequest;
  const res = makeRes();
  await handler(req, res as unknown as NextApiResponse);
  return res;
};

export const lastJson = <T>(res: MockRes): T =>
  res.json.mock.calls[res.json.mock.calls.length - 1][0];

type ProofFetchOptions = {
  ok?: boolean;
  status?: number;
  reject?: boolean;
  /** Never settle until the request's signal aborts. */
  hang?: boolean;
  /** Answer 200 with a body that is not JSON. */
  invalidJson?: boolean;
};

const abortError = () => Object.assign(new Error('aborted'), { name: 'AbortError' });

/** A fetch stub that answers only the domain proof URL. */
export const makeProofFetch = (
  proof: unknown,
  { ok = true, status, reject = false, hang = false, invalidJson = false }: ProofFetchOptions = {},
): jest.Mock =>
  jest.fn(async (url: string, init?: { signal?: AbortSignal }) => {
    if (url !== DOMAIN_PROOF_URL) throw new Error(`unexpected fetch: ${url}`);
    if (reject) throw new Error('network down');
    if (hang) {
      return new Promise((_, rejectFetch) => {
        init?.signal?.addEventListener('abort', () => rejectFetch(abortError()));
      });
    }
    return {
      ok,
      status: status ?? (ok ? 200 : 404),
      json: async () => {
        if (invalidJson) throw new SyntaxError('Unexpected token < in JSON');
        return proof;
      },
    };
  });
