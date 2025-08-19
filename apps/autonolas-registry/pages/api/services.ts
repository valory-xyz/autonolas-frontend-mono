import { GraphQLClient } from "graphql-request";
import type { RequestConfig } from "graphql-request/build/esm/types";
import { NextApiRequest, NextApiResponse } from "next";

const requestConfig: RequestConfig = {
  method: "POST",
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
};

const MM_GNOSIS_GRAPHQL_CLIENT = new GraphQLClient(
  process.env.NEXT_PUBLIC_GNOSIS_MM_SUBGRAPH!,
  requestConfig,
);

const MM_BASE_GRAPHQL_CLIENT = new GraphQLClient(
  process.env.NEXT_PUBLIC_BASE_MM_SUBGRAPH!,
  requestConfig,
);

const LEGACY_MECH_SUBGRAPH_CLIENT = new GraphQLClient(
  process.env.NEXT_PUBLIC_LEGACY_MECH_SUBGRAPH!,
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

interface GraphQLResponse<T> {
  services: T[];
}

const getQuery = ({
  serviceIds,
  isLegacy = false,
}: {
  serviceIds: string[];
  isLegacy?: boolean;
}) => {
  return `
  {
    services(
      where: { 
        id_in: [${serviceIds.map((id) => `"${id}"`).join(", ")}]
      }
    ) {
      id
      totalRequests
      totalDeliveries
      ${
        !isLegacy
          ? `metadata {
          metadata 
      }`
          : ""
      }
    }
  }
`;
};

export const getServicesFromMMSubgraph = async (
  network: Network,
  serviceIds: string[],
): Promise<Service[]> => {
  const client =
    network === "gnosis" ? MM_GNOSIS_GRAPHQL_CLIENT : MM_BASE_GRAPHQL_CLIENT;

  const query = getQuery({ serviceIds });
  const response = await client.request<GraphQLResponse<Service>>(query);
  return response.services;
};

export const getServicesFromLegacyMechSubgraph = async (
  serviceIds: string[],
): Promise<Service[]> => {
  const query = getQuery({ serviceIds, isLegacy: true });
  const response =
    await LEGACY_MECH_SUBGRAPH_CLIENT.request<GraphQLResponse<Service>>(query);
  return response.services;
};

export const mergeServicesData = (
  servicesFromMM: Service[],
  servicesFromLegacy: Service[] = [],
) => {
  const uniqueServiceIds = new Set([
    ...servicesFromMM.map((service) => service.id),
    ...servicesFromLegacy.map((service) => service.id),
  ]);

  const mergedServicesData = Array.from(uniqueServiceIds).map((id) => {
    const serviceFromMM = servicesFromMM.find((service) => service.id === id);
    const serviceFromLegacy = servicesFromLegacy.find(
      (service) => service.id === id,
    );

    const {
      totalRequests: totalRequestsFromMM = 0,
      totalDeliveries: totalDeliveriesFromMM = 0,
      metadata,
    } = serviceFromMM || {};
    const {
      totalRequests: totalRequestsFromLegacy = 0,
      totalDeliveries: totalDeliveriesFromLegacy = 0,
    } = serviceFromLegacy || {};

    return {
      id,
      totalRequestsFromLegacy: Number(totalRequestsFromLegacy),
      totalDeliveriesFromLegacy: Number(totalDeliveriesFromLegacy),
      totalRequestsFromMM: Number(totalRequestsFromMM),
      totalDeliveriesFromMM: Number(totalDeliveriesFromMM),
      totalRequests:
        Number(totalRequestsFromMM) + Number(totalRequestsFromLegacy),
      totalDeliveries:
        Number(totalDeliveriesFromMM) + Number(totalDeliveriesFromLegacy),
      metadata: metadata?.metadata || "",
    };
  });

  return mergedServicesData;
};

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

    const promises = [];

    promises.push(getServicesFromMMSubgraph(network, serviceIds));
    if (network === "gnosis")
      promises.push(getServicesFromLegacyMechSubgraph(serviceIds));

    const [servicesFromMM, servicesFromLegacy] = await Promise.all(promises);

    return res.status(200).json({
      services: mergeServicesData(servicesFromMM, servicesFromLegacy),
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
