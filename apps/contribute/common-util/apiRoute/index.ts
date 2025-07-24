import { Wallet } from 'ethers';

// TODO: fetch from the DB instead of hardcoding.
export const ATTRIBUTE_ID_MAPPING = {
  TWEET: 7,
  USER: 8,
  MODULE_CONFIGS: 9,
  MODULE_DATA: 10,
} as const;

export const getSignature = async (message: string) => {
  const privateKey = process.env.AGENT_DB_WALLET_PRIVATE_KEY;
  if (!privateKey) throw new Error('Missing AGENT_DB_WALLET_PRIVATE_KEY');

  const wallet = new Wallet(privateKey);
  const signature = await wallet.signMessage(message);
  return signature;
};
