import { GraphQLClient } from "graphql-request";
import { RequestConfig } from "graphql-request/build/esm/types";
import { NextApiRequest, NextApiResponse } from "next";

const requestConfig: RequestConfig = {
  method: "POST",
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
};

const GNOSIS_GRAPHQL_CLIENT = new GraphQLClient(
  process.env.NEXT_PUBLIC_GNOSIS_MM_SUBGRAPH!,
  requestConfig,
);

const BASE_GRAPHQL_CLIENT = new GraphQLClient(
  process.env.NEXT_PUBLIC_BASE_MM_SUBGRAPH!,
  requestConfig,
);

type Network = "gnosis" | "base";

type Service = {
  id: string;
  totalRequests: number;
  totalDeliveries: number;
  metadata: {
    metadata: string;
  };
};

type FlattenedService = Omit<Service, "metadata"> & { metadata: string };

interface GraphQLResponse<T> {
  services: T[];
}

/**
 * Fetches services with their latestMultisig for the specified network and service IDs
 * @param network - The network to query ('gnosis' or 'base')
 * @param serviceIds - Array of service IDs to fetch
 * @returns Promise<FlattenedService[]> - Array of services with flattened metadata
 */
export const getServices = async (
  network: Network,
  serviceIds: string[],
): Promise<FlattenedService[]> => {
  const client =
    network === "gnosis" ? GNOSIS_GRAPHQL_CLIENT : BASE_GRAPHQL_CLIENT;

  const query = `
    {
      services(
        where: { 
          id_in: [${serviceIds.map((id) => `"${id}"`).join(", ")}]
        }
      ) {
        id
        latestMultisig
        totalRequests
        totalDeliveries
        metadata {
            metadata 
        }
      }
    }
  `;

  const response = await client.request<GraphQLResponse<Service>>(query);
  const { services } = response;

  const flattenedServices = (services || []).map((service) => ({
    ...service,
    metadata: service.metadata?.metadata,
  }));
  return flattenedServices;
};

// Next.js API route handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { network, serviceIds } = JSON.parse(req.body);

    if (!network || !serviceIds) {
      return res.status(400).json({
        error: "Missing required parameters: network and serviceIds",
      });
    }

    // Validate network parameter
    if (network !== "gnosis" && network !== "base") {
      return res.status(400).json({
        error: "Invalid network. Must be 'gnosis' or 'base'",
      });
    }
    const services = await getServices(network, serviceIds);

    return res.status(200).json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
