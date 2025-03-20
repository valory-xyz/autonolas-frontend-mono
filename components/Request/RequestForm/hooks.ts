import { useCallback, useState } from 'react';
import { Address, getAddress, zeroAddress } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';

import { MECH_MARKETPLACE_ABI, OLAS_MECH_ABI } from 'common-util/AbiAndAddresses';
import { getMechContract, getWeb3Details } from 'common-util/Contracts';
import { getAgentHash, getChainId, getIpfsResponse } from 'common-util/functions';

export const useFetchTools = () => {
  const [isToolsLoading, setIsToolsLoading] = useState(false);
  const [tools, setTools] = useState<string[]>([]);

  const fetchTools = useCallback(async (mechAddress: string) => {
    setIsToolsLoading(true);
    try {
      // TODO: get agent hash from serviceId -> in code hash
      // const contract = getMechContract(mechAddress);
      // const serviceId = await getTokenId(contract);
      const currentHash = getAgentHash([
        '0xcaa53607238e340da63b296acab232c18a48e954f0af6ff2b835b2d93f1962f0',
      ]);
      const data = await getIpfsResponse(currentHash);
      setTools(data.tools || []);
    } catch {
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
