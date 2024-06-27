import { PublicKey } from "@solana/web3.js";
import { Address, isAddress } from "viem";

export type SolanaAddress = PublicKey
export type EVMAddress = Address

export function isSolanaAddress(address?: SolanaAddress | EVMAddress | string | null): boolean {
    if(!address) return false;
    if (isAddress(`${address}`)) return false;
    
    return address instanceof PublicKey
  }

  export function isEVMAddress(address?: SolanaAddress | EVMAddress | string | null): boolean {
    if(!address) return false;
    if (address instanceof PublicKey) return false;
    
    return isAddress(`${address}`)
  }
