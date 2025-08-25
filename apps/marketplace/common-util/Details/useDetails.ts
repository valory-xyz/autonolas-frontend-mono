import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address } from 'viem';

import { NA } from 'libs/util-constants/src/lib/symbols';
import { areAddressesEqual, notifyError } from 'libs/util-functions/src';

import { NavTypesValues } from 'util/constants';

import { useHelpers } from '../hooks';
import { useSvmConnectivity } from '../hooks/useSvmConnectivity';

export const useDetails = ({
  id,
  type,
  getDetails,
  getOwner,
  getTokenUri,
}: {
  id: string;
  type: NavTypesValues;
  getDetails: (id: string) => Promise<{ unitHash: Address; dependencies: string[] }>;
  getTokenUri: (id: string) => Promise<string>;
  getOwner: (id: string) => Promise<string>;
}) => {
  const { account, chainId, isSvm } = useHelpers();
  const { walletPublicKey } = useSvmConnectivity();

  const [isLoading, setIsLoading] = useState(true);
  const [info, setInfo] = useState({});
  const [ownerAddress, setDetailsOwner] = useState(NA);
  const [tokenUri, setTokenUri] = useState<string | null>(null);

  // fetch details such as service details, owner of agent/component/service,
  // token uri
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setInfo([]);

      try {
        const tempDetails = await getDetails(id);
        setInfo(tempDetails);

        const ownerAccount = await getOwner(id);
        setDetailsOwner(ownerAccount || '');

        const tempTokenUri = await getTokenUri(id);
        setTokenUri(tempTokenUri);
      } catch (e) {
        console.error(e);
        notifyError(`Error fetching ${type} details`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [account, chainId, id, type, getDetails, getOwner, getTokenUri]);

  /**
   * function to update details (ie, service info)
   */
  const updateDetails = useCallback(async () => {
    try {
      const details = await getDetails(id);
      setInfo(details);
    } catch (e) {
      console.error(e);
      notifyError(`Error fetching ${type} details`);
    }
  }, [id, type, getDetails]);

  const isOwner = useMemo(() => {
    if (isSvm) {
      if (walletPublicKey && ownerAddress) {
        return areAddressesEqual(walletPublicKey.toString(), ownerAddress);
      }
      return false;
    }

    if (account && ownerAddress) {
      return areAddressesEqual(account.toString(), ownerAddress);
    }

    return false;
  }, [account, ownerAddress, isSvm, walletPublicKey]);

  return {
    isLoading,
    info,
    ownerAddress,
    tokenUri,
    isOwner,
    updateDetails,
  };
};
