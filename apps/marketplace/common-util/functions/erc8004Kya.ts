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

/** A service is active only while its registry state is Deployed. */
export const isServiceDeployed = (state: unknown): boolean =>
  state !== null && state !== undefined && String(state) === SERVICE_STATE_KEY_MAP.deployed;

// Bare hostname: labels of letters, digits and inner hyphens, at least one
// dot, no scheme, path, port or trailing dot.
const HOSTNAME_REGEX =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

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

export const fetchDomainProof = async (domain: string): Promise<DomainProof | null> => {
  if (!isValidOperatorDomain(domain)) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROOF_TIMEOUT_MS);
    const response = await fetch(getDomainProofUrl(domain), {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const json: unknown = await response.json();
    if (!json || typeof json !== 'object') return null;
    return json as DomainProof;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Could not read domain proof for ${domain}:`, message);
    return null;
  }
};

/**
 * True when the proof lists this chain's identity registry with the given
 * agent id. Ownership of the on-chain entry is not part of the check: every
 * Olas entry is owned by the bridger proxy, and the agent id is the service id.
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

/**
 * Resolves the operator to an ERC-8004 / A2A `provider` entry. Returns null
 * unless the manifest names an operator with a valid domain and that domain
 * serves a proof matching the agent id.
 */
export const resolveProvider = async (
  operator: MechOperator | undefined,
  chainId: number,
  agentId: number | null,
): Promise<Erc8004Provider | null> => {
  if (!operator || typeof operator.name !== 'string' || !operator.name.trim()) return null;
  if (!isValidOperatorDomain(operator.domain)) return null;
  if (agentId === null) return null;

  const proof = await fetchDomainProof(operator.domain);
  if (!domainProofMatches(proof, chainId, agentId)) return null;

  return {
    organization: operator.name.trim(),
    url: getOperatorUrl(operator.domain),
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

/**
 * Reads the mech's current price from chain. Never cached: a stale price on a
 * paid action is worse than a missing one, so callers omit the field on null.
 */
export const readMechPrice = async (
  rpcUrl: string,
  chainId: number,
  mechAddress: string,
): Promise<MechPrice | null> => {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const mech = new ethers.Contract(mechAddress, MECH_PRICE_ABI, provider);
    const [maxDeliveryRate, paymentType] = await Promise.all([
      mech.maxDeliveryRate(),
      mech.paymentType(),
    ]);

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
  }
};
