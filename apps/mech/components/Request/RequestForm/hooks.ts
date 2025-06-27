import { readContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { Address } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';

import { MECH_MARKETPLACE_ABI, OLAS_MECH_ABI } from 'common-util/AbiAndAddresses';
import { getWeb3Details } from 'common-util/Contracts';
import { wagmiConfig } from 'common-util/Login/config';
import { getIpfsResponse } from 'common-util/functions';
import { getMetadataHashByServiceId } from 'common-util/functions/requests';

export const useFetchTools = () => {
  const [isToolsLoading, setIsToolsLoading] = useState(false);
  const [tools, setTools] = useState<string[]>([]);

  const fetchTools = useCallback(async (mechAddress: string) => {
    setIsToolsLoading(true);
    try {
      const serviceId = await readContract(wagmiConfig, {
        address: mechAddress as Address,
        abi: OLAS_MECH_ABI,
        functionName: 'tokenId',
      });

      const metadataHash = await getMetadataHashByServiceId(serviceId.toString());
      if (!metadataHash) {
        setTools([]);
        return;
      }

      const data = await getIpfsResponse(metadataHash);
      setTools(data.tools || []);
    } catch (error) {
      console.error(error);
      setTools([]);
    } finally {
      setIsToolsLoading(false);
    }
  }, []);

  return { tools, isToolsLoading, fetchTools };
};

export const useMaxDeliveryRate = (mechAddress: Address) => {
  const { chainId } = getWeb3Details();

  return useReadContract({
    address: mechAddress,
    abi: OLAS_MECH_ABI,
    functionName: 'maxDeliveryRate',
    chainId,
    query: {
      enabled: !!mechAddress,
    },
  });
};

export const usePaymentType = (mechAddress: Address) => {
  const { chainId } = getWeb3Details();

  return useReadContract({
    address: mechAddress,
    abi: OLAS_MECH_ABI,
    functionName: 'paymentType',
    chainId,
    query: {
      enabled: !!mechAddress,
    },
  });
};

export const useResponseTimeoutLimits = () => {
  const { address, chainId } = getWeb3Details();

  return useReadContracts({
    contracts: [
      {
        address: address?.mechMarketplace,
        abi: MECH_MARKETPLACE_ABI,
        functionName: 'minResponseTimeout',
        chainId,
      },
      {
        address: address?.mechMarketplace,
        abi: MECH_MARKETPLACE_ABI,
        functionName: 'maxResponseTimeout',
        chainId,
      },
    ],

    query: {
      select: (res) => {
        const [minRes, maxRes] = res;
        return {
          min: minRes.result ? Number(minRes.result) : 0,
          max: maxRes.result ? Number(maxRes.result) : 0,
        };
      },
    },
  });
};
