import { useState, useEffect } from 'react';
import { useContractRead } from 'wagmi';

import { getAgentHash, getIpfsResponse } from '../../common-util/functions';
import {
  AGENT_REGISTRY_ABI,
  AGENT_REGISTRY_ADDRESS_GNOSIS,
} from '../../common-util/AbiAndAddresses';
import { RequestForm } from './RequestForm';

export const NewRequest = () => {
  const [dataList, setDataList] = useState([]);

  const { data: agentHashes, isLoading } = useContractRead({
    abi: AGENT_REGISTRY_ABI,
    address: AGENT_REGISTRY_ADDRESS_GNOSIS,
    functionName: 'getHashes',
    args: [],
  });

  useEffect(() => {
    const getIpfsDetailsFromId = async () => {
      const currentHash = getAgentHash(agentHashes[1]);

      const data = await getIpfsResponse(currentHash);
      setDataList(data.tools || []);
    };

    if (agentHashes) {
      getIpfsDetailsFromId();
    }
  }, [agentHashes]);

  return <RequestForm isToolsLoading={isLoading} tools={dataList} />;
};
