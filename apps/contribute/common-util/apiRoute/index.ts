import { Wallet } from 'ethers';

export const getSignature = async (message: string) => {
  const privateKey = process.env.AGENT_DB_WALLET_PRIVATE_KEY;
  if (!privateKey) throw new Error('Missing AGENT_DB_WALLET_PRIVATE_KEY');

  const wallet = new Wallet(privateKey);
  const signature = await wallet.signMessage(message);
  return signature;
};
