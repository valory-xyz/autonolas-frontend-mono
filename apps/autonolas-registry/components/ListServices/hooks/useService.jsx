/**
 * hooks to get service information - contract read & write functions
 */

import { useCallback } from 'react';
import { useHelpers } from 'common-util/hooks';
import { notifyError } from '@autonolas/frontend-library';

import { getServiceDetails, getServiceOwner, getTokenUri } from '../utils';
import { useGetSvmServiceDetails, useServiceOwner, useTokenUri } from './useSvmService';

/**
 * hooks to get service details function
 * @returns {function} - function to get service details
 */
export const useGetServiceDetails = () => {
  const { isSvm } = useHelpers();
  const { getSvmServiceDetails } = useGetSvmServiceDetails();

  return useCallback(
    async (id) => {
      if (!id) notifyError('No service id provided');

      const serviceDetails = isSvm ? await getSvmServiceDetails(id) : await getServiceDetails(id);
      return serviceDetails;
    },
    [isSvm, getSvmServiceDetails],
  );
};

/**
 * hooks to get service owner function
 * @returns {function} - function to get service owner
 */
export const useGetServiceOwner = () => {
  const { isSvm } = useHelpers();
  const { getSvmServiceOwner } = useServiceOwner();

  return useCallback(
    async (id) => {
      if (!id) notifyError('No service id provided');

      const serviceOwner = isSvm ? await getSvmServiceOwner(id) : await getServiceOwner(id);
      return serviceOwner;
    },
    [isSvm, getSvmServiceOwner],
  );
};

/**
 * hooks to get service token uri function
 * @returns {function} - function to get service token uri
 */
export const useGetServiceTokenUri = () => {
  const { isSvm } = useHelpers();
  const { getSvmTokenUri } = useTokenUri();

  return useCallback(
    async (id) => {
      if (!id) notifyError('No service id provided');

      const serviceTokenUri = isSvm ? await getSvmTokenUri(id) : await getTokenUri(id);
      return serviceTokenUri;
    },
    [isSvm, getSvmTokenUri],
  );
};
