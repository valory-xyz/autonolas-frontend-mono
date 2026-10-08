import { ethers } from 'ethers';

import { IDENTITY_REGISTRY_UPGRADEABLE } from 'libs/util-contracts/src/lib/abiAndAddresses/identityRegistryUpgradeable';

import { feeUnitForPaymentType } from 'common-util/mechAnalytics/service-activity';
import type { FeeUnit } from 'common-util/types';

import { SERVICE_STATE_KEY_MAP } from 'util/constants';

/**
 * Know-your-agent (KYA) helpers shared by the ERC-8004 routes: the mech
 * manifest shape, operator domain proof, benchmark link and live price.
 */

export type ToolInputOutput = {
  type: string;
  description: string;
  schema?: Record<string, unknown>;
};

export type BenchmarkWindow = '7d' | '30d' | '90d' | 'all';

/** `value` is absent when the mech has no figure for that window yet; the link still stands. */
export type ToolBenchmark = {
  metric: string;
  value?: number;
  window: BenchmarkWindow;
  url: string;
};

export type ToolMetadataEntry = {
  name: string;
  description: string;
  input: ToolInputOutput;
  output: ToolInputOutput;
  benchmark?: ToolBenchmark;
};

export type MechOperator = {
  name: string;
  domain: string;
  contact?: string;
};

/** The JSON a mech publishes on IPFS (its `metadata` hash on the marketplace subgraph). */
export type MechManifest = {
  name: string;
  description: string;
  url?: string;
  inputFormat: string;
  outputFormat: string;
  tools: string[];
  toolMetadata?: Record<string, ToolMetadataEntry>;
  operator?: MechOperator;
};

export type Erc8004Provider = {
  organization: string;
  url: string;
};

export type MechPrice = {
  /** `maxDeliveryRate()` as a decimal integer string in the payment type's smallest unit. */
  amount: string;
  unit: FeeUnit | null;
  /** `paymentType()` bytes32 hash, 0x-prefixed. */
  paymentType: string;
  mechAddress: string;
};

const PROOF_TIMEOUT_MS = 5_000;
const PRICE_READ_TIMEOUT_MS = 3_000;

export const isServiceDeployed = (state: unknown): boolean =>
  state !== null && state !== undefined && String(state) === SERVICE_STATE_KEY_MAP.deployed;

/** Trimmed string for a manifest field that may be missing or wrongly typed. */
export const asText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

// Name left in place from the metadata template shipped with the mech
// tooling. It identifies the template, not the mech, so it never counts as
// the mech's own name.
const TEMPLATE_MECH_NAME_REGEX = /^autonolas mech\b/i;

export const isTemplateMechName = (name: string): boolean => TEMPLATE_MECH_NAME_REGEX.test(name);

/**
 * The mech's own name: the manifest name unless it is absent, not a string
 * or the template default. Empty string when the mech has none.
 */
export const getOwnMechName = (manifest: Pick<MechManifest, 'name'> | null): string => {
  const name = asText(manifest?.name);
  return name && !isTemplateMechName(name) ? name : '';
};

// Bare lowercase hostname per the manifest spec: labels of lowercase
// letters, digits and inner hyphens, at least one dot, no scheme, path,
// port or trailing dot. The last label must not be all digits, which
// keeps IPv4 literals out; IPv6 literals fail on the colons.
const HOSTNAME_REGEX =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z0-9-]*[a-z][a-z0-9-]*$/;

export const isValidOperatorDomain = (domain: unknown): domain is string =>
  typeof domain === 'string' && HOSTNAME_REGEX.test(domain);

export const getOperatorUrl = (domain: string): string => `https://${domain}`;

export const getDomainProofUrl = (domain: string): string =>
  `https://${domain}/.well-known/agent-registration.json`;

export const getIdentityRegistryAddress = (chainId: number): string | undefined =>
  IDENTITY_REGISTRY_UPGRADEABLE.addresses[
    chainId as keyof typeof IDENTITY_REGISTRY_UPGRADEABLE.addresses
  ];

type DomainProofRegistration = {
  agentRegistry?: unknown;
  agentId?: unknown;
};

export type DomainProof = {
  registrations?: DomainProofRegistration[];
};

/**
 * `ok`: the domain served a JSON document. `not-found`: the domain answered
 * but has no usable proof (4xx, redirect, non-object body). `unavailable`:
 * the domain could not be reached or answered 5xx, so nothing is known.
 */
export type DomainProofResult =
  | { status: 'ok'; proof: DomainProof }
  | { status: 'not-found' }
  | { status: 'unavailable' };

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'AbortError';

/**
 * Reads the proof file from the exact host named in the manifest. Redirects
 * are not followed: a proof must be served by the host it vouches for.
 */
export const fetchDomainProof = async (domain: string): Promise<DomainProofResult> => {
  if (!isValidOperatorDomain(domain)) return { status: 'not-found' };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROOF_TIMEOUT_MS);

  try {
    const response = await fetch(getDomainProofUrl(domain), {
      signal: controller.signal,
      redirect: 'error',
    });

    if (response.status >= 500) return { status: 'unavailable' };
    if (!response.ok) return { status: 'not-found' };

    const json: unknown = await response.json();
    if (!json || typeof json !== 'object') return { status: 'not-found' };
    return { status: 'ok', proof: json as DomainProof };
  } catch (error) {
    if (error instanceof SyntaxError) return { status: 'not-found' };

    const message = isAbortError(error)
      ? `timed out after ${PROOF_TIMEOUT_MS}ms`
      : error instanceof Error
        ? error.message
        : 'Unknown error';
    console.warn(`Could not read domain proof for ${domain}:`, message);
    return { status: 'unavailable' };
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * True when the proof lists this chain's identity registry with the given
 * ERC-8004 agent id. Ownership of the on-chain entry is not part of the
 * check: every Olas entry is owned by the bridger proxy.
 */
export const domainProofMatches = (
  proof: DomainProof | null,
  chainId: number,
  agentId: number,
): boolean => {
  const registryAddress = getIdentityRegistryAddress(chainId);
  if (!registryAddress || !proof || !Array.isArray(proof.registrations)) return false;
  if (!Number.isInteger(agentId)) return false;

  const expectedRegistry = `eip155:${chainId}:${registryAddress}`.toLowerCase();

  return proof.registrations.some((registration) => {
    if (!registration || typeof registration !== 'object') return false;
    const { agentRegistry, agentId: proofAgentId } = registration;
    if (typeof agentRegistry !== 'string') return false;
    if (agentRegistry.toLowerCase() !== expectedRegistry) return false;

    const isNumericId =
      typeof proofAgentId === 'number' ||
      (typeof proofAgentId === 'string' && /^\d+$/.test(proofAgentId));
    return isNumericId && Number(proofAgentId) === agentId;
  });
};

export type ProviderResolution = {
  provider: Erc8004Provider | null;
  /** True when the proof could not be read, so `provider: null` is not a verdict. */
  unavailable: boolean;
};

const NO_PROVIDER: ProviderResolution = { provider: null, unavailable: false };

/**
 * Resolves the operator to an A2A `provider` entry. The provider is set only
 * when the manifest names an operator with a valid domain and that domain
 * serves a proof matching the ERC-8004 agent id (read from the registry
 * subgraph; it is not always the service id).
 */
export const resolveProvider = async (
  operator: MechOperator | undefined,
  chainId: number,
  agentId: number | null,
): Promise<ProviderResolution> => {
  if (!operator || !asText(operator.name)) return NO_PROVIDER;
  if (!isValidOperatorDomain(operator.domain)) return NO_PROVIDER;
  if (agentId === null) return NO_PROVIDER;

  const result = await fetchDomainProof(operator.domain);
  if (result.status === 'unavailable') return { provider: null, unavailable: true };
  if (result.status === 'not-found') return NO_PROVIDER;
  if (!domainProofMatches(result.proof, chainId, agentId)) return NO_PROVIDER;

  return {
    provider: { organization: asText(operator.name), url: getOperatorUrl(operator.domain) },
    unavailable: false,
  };
};

/**
 * The benchmark endpoint the operator published. One endpoint covers every
 * tool of a mech, so the single entry is taken from the first tool, by sorted
 * tool name, that carries an https url; later tools are ignored. Null when the
 * operator published none.
 */
export const getBenchmarkUrl = (manifest: Pick<MechManifest, 'toolMetadata'>): string | null => {
  const toolMetadata = manifest.toolMetadata ?? {};
  for (const toolName of Object.keys(toolMetadata).sort()) {
    const url = toolMetadata[toolName]?.benchmark?.url;
    if (typeof url === 'string' && url.startsWith('https://')) return url;
  }
  return null;
};

export const parseAgentId = (rawId: unknown): number | null => {
  if (typeof rawId === 'number') return Number.isInteger(rawId) ? rawId : null;
  if (typeof rawId === 'string' && /^\d+$/.test(rawId)) return Number(rawId);
  return null;
};

const MECH_PRICE_ABI = [
  'function maxDeliveryRate() view returns (uint256)',
  'function paymentType() view returns (bytes32)',
];

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

/**
 * Reads the mech's current price from chain, giving up after
 * PRICE_READ_TIMEOUT_MS. Never cached: a stale price on a paid action is
 * worse than a missing one, so callers omit the field on null.
 */
export const readMechPrice = async (
  rpcUrl: string,
  chainId: number,
  mechAddress: string,
): Promise<MechPrice | null> => {
  const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
  try {
    const mech = new ethers.Contract(mechAddress, MECH_PRICE_ABI, provider);
    const [maxDeliveryRate, paymentType] = await withTimeout(
      Promise.all([mech.maxDeliveryRate(), mech.paymentType()]),
      PRICE_READ_TIMEOUT_MS,
      'mech price read',
    );

    const amount = BigInt(maxDeliveryRate).toString();
    const paymentTypeHash = String(paymentType).toLowerCase();

    return {
      amount,
      unit: feeUnitForPaymentType(paymentTypeHash),
      paymentType: paymentTypeHash,
      mechAddress: `eip155:${chainId}:${mechAddress}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Could not read price from mech ${mechAddress} on chain ${chainId}:`, message);
    return null;
  } finally {
    provider.destroy();
  }
};
