import type { NextApiRequest, NextApiResponse } from 'next';

import { IDENTITY_REGISTRY_UPGRADEABLE } from 'libs/util-contracts/src/lib/abiAndAddresses/identityRegistryUpgradeable';

import { ADDRESSES } from 'common-util/Contracts/addresses';
import { getIpfsResponse } from 'common-util/functions/ipfs';
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
  getServiceFromRegistrySafe,
} from 'common-util/functions/erc8004Helpers';

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

type AgentCardResponse = {
  name: string;
  description: string;
  version: '1.0.0';
  url?: string;
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
    // TODO: resolve mech contract address from subgraph or on-chain
    mechAddress?: string;
    howToHire: {
      summary: string;
      links: Array<{ rel: string; title: string; href: string }>;
    };
  };
  skills: AgentCardSkill[];
};

const buildSkills = (metadata: MechMetadata): AgentCardSkill[] => {
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
        inputSchema: tool.input,
        outputSchema: tool.output,
        metadata: {
          runtimeToolName: tool.name,
          inputFormat,
          outputFormat,
        },
      };
    });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AgentCardResponse | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        error: `Agent cards are not available for network: ${network}. Supported chains: ${MARKETPLACE_SUPPORTED_CHAIN_IDS.join(', ')}`,
      });
    }

    const marketplaceChainId = chainId as keyof typeof MARKETPLACE_SUBGRAPH_CLIENTS;
    const [servicesFromMarketplace, serviceFromRegistry] = await Promise.all([
      getServicesFromMarketplaceSubgraph({
        chainId: marketplaceChainId,
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

    const mechMetadata = untypedIpfsMetadata as unknown as MechMetadata;
    const registrations: AgentCardResponse['registrations'] = [];

    if (serviceFromRegistry?.erc8004Agent?.id) {
      const agentId = Number(serviceFromRegistry.erc8004Agent.id);
      if (!Number.isNaN(agentId)) {
        const identityRegistryAddress =
          IDENTITY_REGISTRY_UPGRADEABLE.addresses[
            chainId as keyof typeof IDENTITY_REGISTRY_UPGRADEABLE.addresses
          ];
        if (identityRegistryAddress) {
          registrations.push({
            agentId,
            agentRegistry: `eip155:${chainId}:${identityRegistryAddress}`,
          });
        }
      }
    }

    const erc8004Network = ERC8004_CHAIN_MAPPING[chainId as keyof typeof ERC8004_CHAIN_MAPPING];
    const chainAddresses = ADDRESSES[chainId];
    const mechMarketplaceAddress =
      chainAddresses && 'mechMarketplace' in chainAddresses
        ? chainAddresses.mechMarketplace
        : undefined;

    const response: AgentCardResponse = {
      name: mechMetadata.name,
      description: mechMetadata.description,
      version: '1.0.0',
      ...(mechMetadata.url && { url: mechMetadata.url }),
      defaultInputModes: ['text/plain'],
      defaultOutputModes: ['application/json'],
      // TODO: Check with Pia
      capabilities: {
        streaming: false,
        pushNotifications: false,
      },
      registrations,
      metadata: {
        network: erc8004Network,
        serviceId,
        sourceToolMetadataCid: metadataHash,
        generatedAt: new Date().toISOString(),
        ...(mechMarketplaceAddress && {
          marketplaceAddress: `eip155:${chainId}:${mechMarketplaceAddress}`,
        }),
        // TODO: check with Pia
        mechAddress: '',
        howToHire: {
          summary:
            'To hire this Mech, follow the Hire guide and submit a request via the Mech Marketplace client. The Marketplace page provides the service details for this network.',
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

    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_DURATION.SIX_HOURS}, stale-while-revalidate=${CACHE_DURATION.FIVE_MINUTES}`,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error generating agent card:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
