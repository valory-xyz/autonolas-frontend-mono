import type { NextApiRequest, NextApiResponse } from 'next';

import { RPC_URLS } from 'libs/util-constants/src';

import { ADDRESSES } from 'common-util/Contracts/addresses';
import { getIpfsCIDFromHash, getIpfsResponse } from 'common-util/functions/ipfs';
import { isMarketplaceSupportedNetwork } from 'common-util/functions';
import type { MarketplaceSubgraphChainId } from 'common-util/graphql';
import { getServicesFromMarketplaceSubgraph } from 'common-util/graphql/services';

import {
  CACHE_DURATION,
  ERC8004_CHAIN_MAPPING,
  MARKETPLACE_SUPPORTED_CHAIN_IDS,
} from 'util/constants';

import {
  getChainIdFromNetworkSlug,
  getSupportedNetworkNames,
  normalizeQueryParam,
  getServiceFromRegistrySafe,
  normalizeToolSchema,
} from 'common-util/functions/erc8004Helpers';
import {
  type Erc8004Provider,
  type MechManifest,
  type MechOperator,
  type MechPayment,
  type ToolInputOutput,
  getIdentityRegistryAddress,
  parseAgentId,
  readMechPayment,
  resolveProvider,
} from 'common-util/functions/erc8004Kya';
import { getCached, getStaleFallback, setCache } from 'util/apiCache';

type AgentCardSkill = {
  id: string;
  name: string;
  description: string;
  inputSchema: ToolInputOutput;
  outputSchema: ToolInputOutput;
  metadata: {
    runtimeToolName: string;
    inputFormat: string;
    outputFormat: string;
  };
};

type AgentCardBody = {
  name: string;
  description: string;
  version: '1.0.0';
  url?: string;
  provider?: Erc8004Provider;
  payment?: MechPayment;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
  };
  registrations: Array<{
    agentId: number;
    agentRegistry: string;
  }>;
  metadata: {
    network: string;
    serviceId: string;
    sourceToolMetadataCid: string;
    generatedAt: string;
    marketplaceAddress?: string;
    mechAddress?: string;
    howToHire: {
      summary: string;
      links: Array<{ rel: string; title: string; href: string }>;
    };
  };
  skills: AgentCardSkill[];
};

/**
 * What the in-memory cache holds. A `*Pending` flag marks a lookup that failed
 * at build time (operator domain unreachable, RPC down); the next hit retries
 * it instead of serving the gap as a verdict.
 */
type CachedAgentCard = {
  body: AgentCardBody;
  mechAddress?: string;
  operator?: MechOperator;
  agentId: number | null;
  providerPending: boolean;
  paymentPending: boolean;
};

const FRESH_CACHE_CONTROL = `public, s-maxage=${CACHE_DURATION.SIX_HOURS}, stale-while-revalidate=${CACHE_DURATION.FIVE_MINUTES}`;
const STALE_CACHE_CONTROL = `public, s-maxage=${CACHE_DURATION.FIVE_MINUTES}, stale-while-revalidate=${CACHE_DURATION.FIVE_MINUTES}`;

const HOW_TO_HIRE_SUMMARY =
  'To hire this Mech, follow the Hire guide and submit a request via the Mech Marketplace client. The Marketplace page provides the service details for this network. The price is quoted by the mech contract at request time: maxDeliveryRate() is the most a request can be charged, and the actual charge may be lower.';

const buildSkills = (metadata: MechManifest): AgentCardSkill[] => {
  const { tools, toolMetadata, inputFormat, outputFormat } = metadata;
  if (!tools || !toolMetadata) return [];

  return tools
    .filter((toolName) => toolName in toolMetadata)
    .map((toolName) => {
      const tool = toolMetadata[toolName];
      return {
        id: `tool:${toolName}`,
        name: toolName,
        description: tool.description,
        inputSchema: normalizeToolSchema(tool.input),
        outputSchema: normalizeToolSchema(tool.output),
        metadata: {
          runtimeToolName: tool.name,
          inputFormat,
          outputFormat,
        },
      };
    });
};

/** Retries the lookups that failed when the card was built, updating the cache on each verdict. */
const settlePending = async (
  cacheKey: string,
  entry: CachedAgentCard,
  chainId: number,
): Promise<CachedAgentCard> => {
  if (!entry.providerPending && !entry.paymentPending) return entry;

  let { body, providerPending, paymentPending } = entry;

  if (providerPending) {
    const resolution = await resolveProvider(entry.operator, chainId, entry.agentId);
    if (!resolution.unavailable) {
      const { provider, ...rest } = body;
      body = resolution.provider ? { ...rest, provider: resolution.provider } : rest;
      providerPending = false;
    }
  }

  const rpcUrl = RPC_URLS[chainId];
  if (paymentPending && rpcUrl && entry.mechAddress) {
    const payment = await readMechPayment(rpcUrl, chainId, entry.mechAddress);
    if (payment) {
      body = { ...body, payment };
      paymentPending = false;
    }
  }

  if (providerPending === entry.providerPending && paymentPending === entry.paymentPending) {
    return entry;
  }
  const settled: CachedAgentCard = { ...entry, body, providerPending, paymentPending };
  setCache(cacheKey, settled);
  return settled;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AgentCardBody | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let cacheKey = '';
  let chainId: keyof typeof ADDRESSES | null = null;

  /** `fromCache` entries may carry pending lookups worth retrying; a freshly built entry was just attempted. */
  const sendEntry = async (
    entry: CachedAgentCard,
    { stale, fromCache }: { stale: boolean; fromCache: boolean },
  ) => {
    if (stale) res.setHeader('X-Cache-Status', 'stale');
    res.setHeader('Cache-Control', stale ? STALE_CACHE_CONTROL : FRESH_CACHE_CONTROL);
    if (chainId === null || !fromCache) return res.status(200).json(entry.body);

    const settled = await settlePending(cacheKey, entry, chainId);
    return res.status(200).json(settled.body);
  };

  try {
    const { network: networkParam, serviceId: serviceIdParam } = req.query;
    const network = normalizeQueryParam(networkParam);
    const serviceId = normalizeQueryParam(serviceIdParam);

    if (!network || !serviceId) {
      return res.status(400).json({
        error: 'Missing required parameters: network or serviceId',
      });
    }

    if (!/^\d+$/.test(serviceId)) {
      return res.status(400).json({
        error: 'Invalid serviceId: must be a positive integer',
      });
    }

    const unTypedChainId = getChainIdFromNetworkSlug(network);
    if (!unTypedChainId) {
      return res.status(400).json({
        error: `Invalid network: ${network}. Supported networks are: ${getSupportedNetworkNames()}`,
      });
    }

    chainId = unTypedChainId as keyof typeof ADDRESSES;

    if (!isMarketplaceSupportedNetwork(chainId)) {
      return res.status(400).json({
        error: `Agent cards are not available for network: ${network}. Supported chain IDs: ${[...MARKETPLACE_SUPPORTED_CHAIN_IDS].join(', ')}`,
      });
    }

    cacheKey = `agentCard:${network}:${serviceId}`;
    const cached = getCached<CachedAgentCard>(cacheKey);
    if (cached) {
      return sendEntry(cached, { stale: false, fromCache: true });
    }

    const marketplaceSubgraphChainId = chainId as MarketplaceSubgraphChainId;
    const [servicesFromMarketplace, serviceFromRegistry] = await Promise.all([
      getServicesFromMarketplaceSubgraph({
        chainId: marketplaceSubgraphChainId,
        serviceIds: [serviceId],
      }),
      getServiceFromRegistrySafe(chainId, serviceId),
    ]);

    const serviceFromMarketplace = servicesFromMarketplace?.[0];
    if (!serviceFromMarketplace) {
      return res.status(404).json({
        error: `Service ${serviceId} not found on network ${network}`,
      });
    }

    const metadataHash = serviceFromMarketplace.metadata;
    if (!metadataHash) {
      return res.status(404).json({
        error: `No metadata found for service ${serviceId} on network ${network}`,
      });
    }

    const untypedIpfsMetadata = await getIpfsResponse(metadataHash);
    if (!untypedIpfsMetadata) {
      return res.status(502).json({ error: 'Failed to fetch metadata from IPFS' });
    }

    const mechMetadata = untypedIpfsMetadata as unknown as MechManifest;

    if (!mechMetadata.name || !mechMetadata.description) {
      console.warn(`Invalid IPFS metadata for agent card ${cacheKey}, falling back to cache`);
      const stale = getStaleFallback<CachedAgentCard>(cacheKey);
      if (stale) {
        return sendEntry(stale, { stale: true, fromCache: true });
      }
      return res.status(502).json({ error: 'Invalid metadata from IPFS' });
    }

    const registrations: AgentCardBody['registrations'] = [];
    const agentId = parseAgentId(serviceFromRegistry?.erc8004Agent?.id);
    const identityRegistryAddress = getIdentityRegistryAddress(chainId);

    if (agentId !== null && identityRegistryAddress) {
      registrations.push({
        agentId,
        agentRegistry: `eip155:${chainId}:${identityRegistryAddress}`,
      });
    }

    const mechAddress = serviceFromMarketplace.mechAddresses?.[0];
    const rpcUrl = RPC_URLS[chainId];
    const [resolution, payment] = await Promise.all([
      resolveProvider(mechMetadata.operator, chainId, agentId),
      mechAddress && rpcUrl ? readMechPayment(rpcUrl, chainId, mechAddress) : Promise.resolve(null),
    ]);
    const provider = resolution.provider;

    const erc8004Network = ERC8004_CHAIN_MAPPING[chainId as keyof typeof ERC8004_CHAIN_MAPPING];
    const chainAddresses = ADDRESSES[chainId];
    const mechMarketplaceAddress =
      chainAddresses && 'mechMarketplace' in chainAddresses
        ? chainAddresses.mechMarketplace
        : undefined;

    const body: AgentCardBody = {
      name: mechMetadata.name,
      description: mechMetadata.description,
      version: '1.0.0',
      ...(mechMetadata.url && { url: mechMetadata.url }),
      ...(provider && { provider }),
      ...(payment && { payment }),
      defaultInputModes: ['text/plain'],
      defaultOutputModes: ['application/json'],
      capabilities: {
        streaming: false,
        pushNotifications: false,
      },
      registrations,
      metadata: {
        network: erc8004Network,
        serviceId,
        sourceToolMetadataCid: getIpfsCIDFromHash(metadataHash),
        generatedAt: new Date().toISOString(),
        ...(mechMarketplaceAddress && {
          marketplaceAddress: `eip155:${chainId}:${mechMarketplaceAddress}`,
        }),
        ...(mechAddress && { mechAddress: `eip155:${chainId}:${mechAddress}` }),
        howToHire: {
          summary: HOW_TO_HIRE_SUMMARY,
          links: [
            {
              rel: 'hire',
              title: 'Hire an agent (Mech Marketplace guide)',
              href: 'https://build.olas.network/hire',
            },
            {
              rel: 'marketplace',
              title: 'Marketplace service page',
              href: `https://marketplace.olas.network/${network}/ai-agents/${serviceId}`,
            },
          ],
        },
      },
      skills: buildSkills(mechMetadata),
    };

    const entry: CachedAgentCard = {
      body,
      mechAddress,
      operator: mechMetadata.operator,
      agentId,
      providerPending: resolution.unavailable,
      paymentPending: Boolean(mechAddress && rpcUrl) && payment === null,
    };
    setCache(cacheKey, entry);

    return sendEntry(entry, { stale: false, fromCache: false });
  } catch (error) {
    if (cacheKey) {
      const stale = getStaleFallback<CachedAgentCard>(cacheKey);
      if (stale) {
        console.warn(`Serving stale agent card cache for ${cacheKey} due to upstream error`);
        return sendEntry(stale, { stale: true, fromCache: true });
      }
    }

    console.error('Error generating agent card:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
