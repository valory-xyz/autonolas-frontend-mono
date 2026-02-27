import type { NextApiRequest, NextApiResponse } from 'next';

import { ADDRESSES } from 'common-util/Contracts/addresses';
import { getIpfsCIDFromHash, getIpfsResponse } from 'common-util/functions/ipfs';
import { MARKETPLACE_SUBGRAPH_CLIENTS } from 'common-util/graphql';
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
} from 'common-util/functions/erc8004Helpers';
import { getCached, getStaleFallback, setCache } from 'util/apiCache';

type ToolInputOutput = {
  type: string;
  description: string;
  schema?: Record<string, unknown>;
};

type ToolMetadataEntry = {
  name: string;
  description: string;
  input: ToolInputOutput;
  output: ToolInputOutput;
};

type MechMetadata = {
  name: string;
  description: string;
  url?: string;
  inputFormat: string;
  outputFormat: string;
  tools: string[];
  toolMetadata?: Record<string, ToolMetadataEntry>;
};

type McpTool = {
  name: string;
  description: string;
  inputSchema: ToolInputOutput;
  outputSchema: ToolInputOutput;
};

type McpResponse = {
  type: 'mcp-server-v1';
  name: string;
  description: string;
  version: '1.0.0';
  endpoint: string;
  capabilities: {
    tools: true;
    resources: false;
    prompts: false;
    streaming: false;
  };
  auth: {
    methods: Array<
      | { type: 'api_key'; header: string }
      | { type: 'wallet_signature'; scheme: string; header: string }
    >;
    required: string[];
  };
  metadata: {
    network: string;
    serviceId: string;
    sourceToolMetadataCid: string;
    generatedAt: string;
    marketplaceAddress?: string;
    mechAddress?: string;
  };
  tools: McpTool[];
};

const MCP_CAPABILITIES: McpResponse['capabilities'] = {
  tools: true,
  resources: false,
  prompts: false,
  streaming: false,
};

const MCP_AUTH: McpResponse['auth'] = {
  methods: [
    { type: 'api_key', header: 'X-API-Key' },
    { type: 'wallet_signature', scheme: 'eip712', header: 'X-Signature' },
  ],
  required: ['api_key', 'wallet_signature'],
};

const buildMcpTools = (metadata: MechMetadata): McpTool[] => {
  const { tools, toolMetadata } = metadata;
  if (!tools || !toolMetadata) return [];

  return tools
    .filter((toolName) => toolName in toolMetadata)
    .map((toolName) => {
      const tool = toolMetadata[toolName];
      return {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.input,
        outputSchema: tool.output,
      };
    });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<McpResponse | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let cacheKey = '';

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

    const chainId = unTypedChainId as keyof typeof ADDRESSES;

    if (
      !MARKETPLACE_SUPPORTED_CHAIN_IDS.includes(
        chainId as (typeof MARKETPLACE_SUPPORTED_CHAIN_IDS)[number],
      )
    ) {
      return res.status(400).json({
        error: `MCP descriptors are not available for network: ${network}. Supported chains: ${MARKETPLACE_SUPPORTED_CHAIN_IDS.join(', ')}`,
      });
    }

    cacheKey = `mcp:${network}:${serviceId}`;
    const cached = getCached<McpResponse>(cacheKey);
    if (cached) {
      res.setHeader(
        'Cache-Control',
        `public, s-maxage=${CACHE_DURATION.SIX_HOURS}, stale-while-revalidate=${CACHE_DURATION.FIVE_MINUTES}`,
      );
      return res.status(200).json(cached);
    }

    const marketplaceChainId = chainId as keyof typeof MARKETPLACE_SUBGRAPH_CLIENTS;
    const servicesFromMarketplace = await getServicesFromMarketplaceSubgraph({
      chainId: marketplaceChainId,
      serviceIds: [serviceId],
    });

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

    const mechMetadata = untypedIpfsMetadata as unknown as MechMetadata;

    if (!mechMetadata.name || !mechMetadata.description) {
      console.warn(`Invalid IPFS metadata for MCP ${cacheKey}, falling back to cache`);
      const stale = getStaleFallback<McpResponse>(cacheKey);
      if (stale) {
        res.setHeader('X-Cache-Status', 'stale');
        res.setHeader(
          'Cache-Control',
          `public, s-maxage=${CACHE_DURATION.FIVE_MINUTES}, stale-while-revalidate=${CACHE_DURATION.FIVE_MINUTES}`,
        );
        return res.status(200).json(stale);
      }
      return res.status(502).json({ error: 'Invalid metadata from IPFS' });
    }

    const erc8004Network = ERC8004_CHAIN_MAPPING[chainId as keyof typeof ERC8004_CHAIN_MAPPING];
    const chainAddresses = ADDRESSES[chainId];
    const mechMarketplaceAddress =
      chainAddresses && 'mechMarketplace' in chainAddresses
        ? chainAddresses.mechMarketplace
        : undefined;

    const response: McpResponse = {
      type: 'mcp-server-v1',
      name: mechMetadata.name,
      description: mechMetadata.description,
      version: '1.0.0',
      endpoint: mechMetadata.url || '',
      capabilities: MCP_CAPABILITIES,
      auth: MCP_AUTH,
      metadata: {
        network: erc8004Network,
        serviceId,
        sourceToolMetadataCid: getIpfsCIDFromHash(metadataHash),
        generatedAt: new Date().toISOString(),
        ...(mechMarketplaceAddress && {
          marketplaceAddress: `eip155:${chainId}:${mechMarketplaceAddress}`,
        }),
        ...(serviceFromMarketplace.mechAddresses?.[0] && {
          mechAddress: `eip155:${chainId}:${serviceFromMarketplace.mechAddresses[0]}`,
        }),
      },
      tools: buildMcpTools(mechMetadata),
    };

    setCache(cacheKey, response);

    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_DURATION.SIX_HOURS}, stale-while-revalidate=${CACHE_DURATION.FIVE_MINUTES}`,
    );

    return res.status(200).json(response);
  } catch (error) {
    if (cacheKey) {
      const stale = getStaleFallback<McpResponse>(cacheKey);
      if (stale) {
        console.warn(`Serving stale MCP cache for ${cacheKey} due to upstream error`);
        res.setHeader('X-Cache-Status', 'stale');
        res.setHeader(
          'Cache-Control',
          `public, s-maxage=${CACHE_DURATION.FIVE_MINUTES}, stale-while-revalidate=${CACHE_DURATION.FIVE_MINUTES}`,
        );
        return res.status(200).json(stale);
      }
    }

    console.error('Error generating MCP descriptor:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
