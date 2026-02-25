import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src/lib/symbols';

import {
  ERC8004_BASEURL,
  ERC8004_CHAIN_MAPPING,
  HASH_DETAILS_STATE,
  NavTypesValues,
} from 'util/constants';
import { NAV_TYPES } from 'util/constants';
import { ERC8004_SUPPORTED_CHAINS, REGISTRY_SUBGRAPH_CLIENTS } from 'common-util/graphql';
import { getServiceFromRegistry } from 'common-util/graphql/registry';

const useErc8004ScanUrl = ({
  chainId,
  serviceId,
}: Pick<ViewHashAndCodeProps, 'chainId' | 'serviceId'>) => {
  const [agentId, setAgentId] = useState<string | null>(null);

  const chainName = ERC8004_CHAIN_MAPPING[chainId as keyof typeof ERC8004_CHAIN_MAPPING] ?? null;

  const fetchAndSetErc8004AgentId = useCallback(
    async (serviceId: string) => {
      try {
        const serviceDetails = await getServiceFromRegistry({
          chainId: chainId as keyof typeof REGISTRY_SUBGRAPH_CLIENTS,
          id: serviceId,
          includeErc8004: true,
        });
        const erc8004AgentId = serviceDetails?.erc8004Agent?.id ?? null;
        setAgentId(erc8004AgentId);
      } catch (error) {
        setAgentId(null);
        console.error('Error fetching service details for serviceId:', serviceId, error);
      }
    },
    [chainId],
  );

  useEffect(() => {
    if (!chainId || !serviceId) return;
    if (!ERC8004_SUPPORTED_CHAINS.some((id) => id === chainId)) return;
    if (!(chainId in REGISTRY_SUBGRAPH_CLIENTS)) return;

    fetchAndSetErc8004AgentId(serviceId);
  }, [chainId, fetchAndSetErc8004AgentId, serviceId]);

  if (!agentId || !chainName) return null;
  return `${ERC8004_BASEURL}/${chainName}/${agentId}`;
};

type ViewHashAndCodeProps = {
  type: NavTypesValues;
  metadataLoadState: string;
  hashUrl: string;
  codeHref: string;
  chainId?: number | null;
  serviceId?: string | null;
};

/**
 * Displays view hash, view code, and ERC-8004 API buttons redirecting to
 * links respectively
 */
export const ViewHashAndCode = ({
  type,
  metadataLoadState,
  hashUrl,
  codeHref,
  chainId,
  serviceId,
}: ViewHashAndCodeProps) => {
  const erc8004ScanUrl = useErc8004ScanUrl({ chainId, serviceId });

  if (HASH_DETAILS_STATE.LOADED !== metadataLoadState) return null;

  return (
    <>
      {type === NAV_TYPES.AI_AGENTS && <>&nbsp;•&nbsp;</>}
      <Link target="_blank" data-testid="view-hash-link" href={hashUrl}>
        View Hash {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </Link>
      &nbsp;•&nbsp;
      <Link target="_blank" data-testid="view-code-link" href={codeHref}>
        View Code {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </Link>
      {type === NAV_TYPES.AI_AGENTS && erc8004ScanUrl && (
        <>
          &nbsp;•&nbsp;
          <Link target="_blank" data-testid="erc8004-api-link" href={erc8004ScanUrl}>
            ERC-8004 Metadata {UNICODE_SYMBOLS.EXTERNAL_LINK}
          </Link>
        </>
      )}
    </>
  );
};
