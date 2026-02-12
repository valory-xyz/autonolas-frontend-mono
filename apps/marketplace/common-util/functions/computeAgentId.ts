import { keccak256, toUtf8Bytes, getAddress, AbiCoder } from 'ethers';
import { ADDRESSES } from 'common-util/Contracts/addresses';
import { isL1Network } from 'libs/util-functions/src';

const abi = new AbiCoder();

/**
 * Matches:
 * keccak256(
 *   abi.encode(
 *     keccak256(bytes(string.concat("eip155:", Strings.toString(chainId)))),
 *     serviceRegistryContract,
 *     tokenId
 *   )
 * )
 *
 * In this implementation:
 * - caip2      = `eip155:${chainId}`
 * - caip2Hash  = keccak256(bytes(caip2))
 * - encoded    = abi.encode(bytes32 caip2Hash, address serviceRegistryContract, uint256 tokenId)
 *
 * NOTE: This is abi.encode (NOT encodePacked), so we use AbiCoder.encode.
 */
export function computeAgentId(chainId: keyof typeof ADDRESSES, tokenId: number): string {
  const isL1 = isL1Network(chainId);
  const serviceRegistryContract = isL1
    ? (ADDRESSES[chainId] as { serviceRegistry: string }).serviceRegistry
    : (ADDRESSES[chainId] as { serviceRegistryL2: string }).serviceRegistryL2;
  if (!serviceRegistryContract) {
    throw new Error(`Unsupported chainId ${chainId} for computeAgentId`);
  }

  const caip2 = `eip155:${chainId}`;
  const caip2Hash = keccak256(toUtf8Bytes(caip2));
  const registry = getAddress(serviceRegistryContract);

  const encoded = abi.encode(['bytes32', 'address', 'uint256'], [caip2Hash, registry, tokenId]);

  return keccak256(encoded);
}
