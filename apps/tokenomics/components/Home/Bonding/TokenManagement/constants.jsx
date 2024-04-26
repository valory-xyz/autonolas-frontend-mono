import { web3 } from '@coral-xyz/anchor';
import { TickUtil } from '@orca-so/whirlpools-sdk';
import { VM_TYPE } from '@autonolas/frontend-library';

import { ADDRESSES } from 'common-util/constants/addresses';

export const PROGRAM_ID = new web3.PublicKey(
  '1BoXeb8hobfLCHNsyCoG1jpEv41ez4w4eDrJ48N1jY3',
);
export const ORCA = new web3.PublicKey(
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
);
export const WHIRLPOOL = new web3.PublicKey(
  ADDRESSES[VM_TYPE.SVM].balancerVault,
);
export const SOL = new web3.PublicKey(
  'So11111111111111111111111111111111111111112',
);
export const BRIDGED_TOKEN_MINT = new web3.PublicKey(
  'CeZ77ti3nPAmcgRkBkUC1JcoAhR8jRti2DHaCcuyUnzR',
);
export const PDA_POSITION_ACCOUNT = new web3.PublicKey(
  'sVFBxraUUqmiVFeruh1M7bZS9yuNcoH7Nysh3YTSnZJ',
);
export const FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_A = new web3.PublicKey(
  'Gn7oD4PmQth4ehA4b8PpHzq5v1UXPL61jAZd6CSuPvFU',
);
export const FEE_COLLECTOR_TOKEN_OWNER_ACCOUNT_B = new web3.PublicKey(
  'FPaBgHbaJR39WBNn6xZRAmurQCBH9QSNWZ5Kk26cGs9d',
);
export const LOCKBOX = new web3.PublicKey(
  '3UaaD3puPemoZk7qFYJWWCvmN6diS7P63YR4Si9QRpaW',
);
export const POSITION = new web3.PublicKey(
  'EHQbFx7m5gPBqXXiViNBfHJDRUuFgqqYsLzuWu18ckaR',
);
export const POSITION_MINT = new web3.PublicKey(
  '36WxSP8trn5czobJaa2Ka7jN58B7sCN7xx2HDom6TDEh',
);
export const TOKEN_VAULT_A = new web3.PublicKey(
  'CLA8hU8SkdCZ9cJVLMfZQfcgAsywZ9txBJ6qrRAqthLx',
);
export const TOKEN_VAULT_B = new web3.PublicKey(
  '6E8pzDK8uwpENc49kp5xo5EGydYjtamPSmUKXxum4ybb',
);
export const TICK_ARRAY_LOWER = new web3.PublicKey(
  '3oJAqTKTCdGvLS9zpoBquWvMjwthu9Np67Qp4W8AT843',
);
export const TICK_ARRAY_UPPER = new web3.PublicKey(
  'J3eMJUQWLmSsG5VnXVFHCGwakpKmzi4jkNvi3vbCZQ3o',
);
export const TICK_SPACING = 64;
export const WHIRLPOOL_CONFIG_ID = new web3.PublicKey(
  '2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ',
);
export const [tickLowerIndex, tickUpperIndex] =
  TickUtil.getFullRangeTickIndex(TICK_SPACING);
export const CONNECT_SVM_WALLET = 'Please connect your phantom wallet';

export const SVM_AMOUNT_DIVISOR = 100000000;
