import {
  domainProofMatches,
  getBenchmarkUrl,
  isServiceDeployed,
  isValidOperatorDomain,
  parseAgentId,
} from 'common-util/functions/erc8004Kya';
import { feeUnitForPaymentType } from 'common-util/mechAnalytics/service-activity';

const GNOSIS = 100;
const GNOSIS_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const NATIVE_HASH = 'ba699a34be8fe0e7725e93dcbce1701b0211a8ca61330aaeb8a05bf2ec7abed1';

describe('isValidOperatorDomain', () => {
  it.each(['valory.xyz', 'mechs.valory.xyz', 'xn--80ak6aa92e.com', 'a-b.example.co.uk'])(
    'accepts bare hostname %s',
    (domain) => {
      expect(isValidOperatorDomain(domain)).toBe(true);
    },
  );

  it.each([
    'https://valory.xyz',
    'valory.xyz/',
    'valory.xyz/.well-known',
    'valory.xyz.',
    'valory.xyz:443',
    'valory',
    '-valory.xyz',
    'valory-.xyz',
    'val ory.xyz',
    '',
    null,
    undefined,
    42,
  ])('rejects %p', (domain) => {
    expect(isValidOperatorDomain(domain)).toBe(false);
  });
});

describe('domainProofMatches', () => {
  const proofFor = (agentRegistry: string, agentId: unknown) => ({
    registrations: [{ agentRegistry, agentId }],
  });

  it('matches on registry address and agent id regardless of address casing', () => {
    expect(domainProofMatches(proofFor(`eip155:100:${GNOSIS_REGISTRY}`, 7), GNOSIS, 7)).toBe(true);
    expect(
      domainProofMatches(proofFor(`eip155:100:${GNOSIS_REGISTRY.toLowerCase()}`, 7), GNOSIS, 7),
    ).toBe(true);
  });

  it('accepts a numeric string agent id', () => {
    expect(domainProofMatches(proofFor(`eip155:100:${GNOSIS_REGISTRY}`, '7'), GNOSIS, 7)).toBe(
      true,
    );
  });

  it('matches when any one of several registrations fits', () => {
    const proof = {
      registrations: [
        { agentRegistry: `eip155:1:${GNOSIS_REGISTRY}`, agentId: 7 },
        { agentRegistry: `eip155:100:${GNOSIS_REGISTRY}`, agentId: 7 },
      ],
    };
    expect(domainProofMatches(proof, GNOSIS, 7)).toBe(true);
  });

  it.each([
    ['another agent id', proofFor(`eip155:100:${GNOSIS_REGISTRY}`, 8), GNOSIS, 7],
    ['another chain', proofFor(`eip155:1:${GNOSIS_REGISTRY}`, 7), GNOSIS, 7],
    ['another registry', proofFor(`eip155:100:0x${'11'.repeat(20)}`, 7), GNOSIS, 7],
    ['a non-numeric agent id', proofFor(`eip155:100:${GNOSIS_REGISTRY}`, '7a'), GNOSIS, 7],
    ['a fractional agent id string', proofFor(`eip155:100:${GNOSIS_REGISTRY}`, '7.0'), GNOSIS, 7],
    ['a missing registry field', { registrations: [{ agentId: 7 }] }, GNOSIS, 7],
    ['registrations that is not an array', { registrations: {} }, GNOSIS, 7],
    ['no registrations key', {}, GNOSIS, 7],
    ['a null proof', null, GNOSIS, 7],
    ['a chain without an identity registry', proofFor(`eip155:999:${GNOSIS_REGISTRY}`, 7), 999, 7],
    ['a non-integer expected agent id', proofFor(`eip155:100:${GNOSIS_REGISTRY}`, 7), GNOSIS, 7.5],
  ])('rejects %s', (_label, proof, chainId, agentId) => {
    expect(domainProofMatches(proof as never, chainId, agentId)).toBe(false);
  });
});

describe('getBenchmarkUrl', () => {
  const tool = (benchmark?: Record<string, unknown>) => ({
    name: 't',
    description: '',
    input: { type: 'text', description: '' },
    output: { type: 'text', description: '' },
    ...(benchmark && { benchmark }),
  });

  it('picks the url of the first tool by sorted name, not by insertion order', () => {
    const manifest = {
      toolMetadata: {
        zeta: tool({ metric: 'accuracy', window: '30d', url: 'https://x.test/zeta' }),
        alpha: tool({ metric: 'accuracy', window: '30d', url: 'https://x.test/alpha' }),
      },
    };
    expect(getBenchmarkUrl(manifest as never)).toBe('https://x.test/alpha');
  });

  it('skips tools without a benchmark and returns the first https url in sorted order', () => {
    const manifest = {
      toolMetadata: {
        a: tool(),
        b: tool({
          metric: 'accuracy',
          value: 0.8,
          window: '30d',
          url: 'https://x.test/m',
        }),
        c: tool({
          metric: 'accuracy',
          value: 0.8,
          window: '30d',
          url: 'https://x.test/other',
        }),
      },
    };
    expect(getBenchmarkUrl(manifest as never)).toBe('https://x.test/m');
  });

  it('keeps the link for a benchmark that has no value yet', () => {
    const manifest = {
      toolMetadata: { a: tool({ metric: 'accuracy', window: '7d', url: 'https://x.test/m' }) },
    };
    expect(getBenchmarkUrl(manifest as never)).toBe('https://x.test/m');
  });

  it.each([
    ['no toolMetadata', {}],
    ['tools without benchmark', { toolMetadata: { a: tool() } }],
    ['an http url', { toolMetadata: { a: tool({ url: 'http://x.test/m' }) } }],
    ['a non-string url', { toolMetadata: { a: tool({ url: 42 }) } }],
  ])('returns null for %s', (_label, manifest) => {
    expect(getBenchmarkUrl(manifest as never)).toBeNull();
  });
});

describe('isServiceDeployed', () => {
  it.each([4, '4', 4n])('is true for Deployed (%p)', (state) => {
    expect(isServiceDeployed(state)).toBe(true);
  });

  it.each([0, 1, 2, 3, 5, '5', 5n, null, undefined, '', 'Deployed'])('is false for %p', (state) => {
    expect(isServiceDeployed(state)).toBe(false);
  });
});

describe('parseAgentId', () => {
  it.each([
    ['7', 7],
    [7, 7],
    ['0', 0],
    ['7.5', null],
    ['abc', null],
    ['', null],
    [null, null],
    [undefined, null],
  ])('parses %p to %p', (raw, expected) => {
    expect(parseAgentId(raw)).toBe(expected);
  });
});

describe('feeUnitForPaymentType', () => {
  it.each([
    [`0x${NATIVE_HASH}`, 'NATIVE'],
    [NATIVE_HASH, 'NATIVE'],
    [`0X${NATIVE_HASH.toUpperCase()}`, 'NATIVE'],
    ['0x6406bb5f31a732f898e1ce9fdd988a80a808d36ab5d9a4a4805a8be8d197d5e3', 'USDC'],
    ['0x803dd08fe79d91027fc9024e254a0942372b92f3ccabc1bd19f4a5c2b251c316', 'CREDITS'],
    [`0x${'77'.repeat(32)}`, null],
    ['', null],
  ])('maps %s to %p', (hash, unit) => {
    expect(feeUnitForPaymentType(hash)).toBe(unit);
  });
});
