import { HASH_PREFIX } from '../../util/constants';
import { REGISTRY_GRAPHQL_CLIENT } from '../graphql';

/** Re-exported so existing call sites keep working; the client itself lives in common-util/graphql. */
export const GRAPHQL_CLIENT = REGISTRY_GRAPHQL_CLIENT;

export const UNIT_FIELDS = `{
  id
  tokenId
  owner
  publicId
  packageHash
  metadataHash
}`;

/**
 * Searches by
 * - publicId (package name)
 * - description,
 * - tokenId
 * - packageHash
 * - owner
 * @returns  {string} search filter sub query
 */
export const getSearchFilterSubQueryForUnitFields = (searchValue) => {
  const completeMetadataHash = searchValue.replace(/0x/g, HASH_PREFIX);
  return `{ 
    or: [
      { publicId_contains_nocase: "${searchValue}" } 
      { description_contains_nocase: "${searchValue}" }
      { packageHash_contains_nocase: "${searchValue}" }
      { owner_contains_nocase: "${searchValue}" }
      { metadataHash_contains_nocase: "${completeMetadataHash}" }
    ]
  }`;
};
