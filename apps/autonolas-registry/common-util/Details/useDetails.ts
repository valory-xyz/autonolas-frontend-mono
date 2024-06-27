import { useCallback, useEffect, useMemo, useState } from 'react';

import { areAddressesEqual, notifyError } from '@autonolas/frontend-library';

import { useHelpers } from '../hooks';
import { useSvmConnectivity } from '../hooks/useSvmConnectivity';
import { Address } from 'viem';
import BigNumber from 'bignumber.js';
import { UnitDetails } from 'types/details';

type useDetailsProps = {
  id: BigNumber;
  type: string;
  getDetails: (id: BigNumber) => Promise<UnitDetails>;
  getOwner: (id: BigNumber) => Promise<Address>;
  getTokenUri: (id: BigNumber) => Promise<string>;
};

export const useDetails = ({ id, type, getDetails, getOwner, getTokenUri }: useDetailsProps) => {
  const { account, isSvm } = useHelpers();
  const { walletPublicKey } = useSvmConnectivity();

  const [isLoading, setIsLoading] = useState(true);
  const [info, setInfo] = useState<UnitDetails>();
  
  const [ownerAddress, setDetailsOwner] = useState<Address>();

  const [tokenUri, setTokenUri] = useState<string>();

  // fetch details such as service details, owner of agent/component/service,
  // token uri
  useEffect(() => {
    setIsLoading(true);
    const promiseDetails = getDetails(id);
    const promiseTokenUri = getTokenUri(id);
    const promiseOwner = getOwner(id);

    Promise.all([promiseDetails, promiseTokenUri, promiseOwner])
      .then(([details, tokenUri, owner]) => {
        setInfo(details);
        setTokenUri(tokenUri);
        setDetailsOwner(owner);
      })
      .catch((e) => {
        console.error(e);
        notifyError(`Error fetching ${type} details`);
      })
      .finally(() => {
        setIsLoading(false);
      });
    // only needs to run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        return areAddressesEqual(`${walletPublicKey}`, `${ownerAddress}`);
      }
      return false;
    }

    if (account && ownerAddress) {
      return areAddressesEqual(`${account}`, `${ownerAddress}`);
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
