import { sendTransaction } from '@autonolas/frontend-library';
import {
  getContractAddress,
  getBuolasContract,
  getOlasContract,
} from 'common-util/Contracts';
import { MAX_AMOUNT, parseEther } from 'common-util/functions';

const SIGNER_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

export const approveOlasByOwner = ({ account, chainId }) => new Promise((resolve, reject) => {
  const contract = getOlasContract(window.MODAL_PROVIDER, chainId);
  const spender = getContractAddress('buOlas', chainId);

  const fn = contract.methods
    .approve(spender, MAX_AMOUNT)
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => {
      resolve(response);
    })
    .catch((e) => {
      window.console.log('Error occured on approving buOLAS by owner');
      reject(e);
    });
});

/**
 * create lock for buOlas
 * NOTE: this is a internal method and won't be exposed or visible to the user
 */
export const createBuolasLockRequest = ({ account, chainId }) => new Promise((resolve, reject) => {
  const contract = getBuolasContract(window.MODAL_PROVIDER, chainId);

  // creating lock for the signer with 100 ETH & locked for 4 years.
  // address is fetched when BE is connected locally
  const values = {
    signer: SIGNER_ADDRESS,
    amount: parseEther('100'),
    numSteps: 4,
  };

  const fn = contract.methods
    .createLockFor(values.signer, values.amount, values.numSteps)
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => resolve(response?.transactionHash))
    .catch((e) => {
      window.console.log('Error occured on creating buOlas lock');
      reject(e);
    });
});

/**
 * Withdraw buOlas
 */
export const withdrawRequest = ({ account, chainId }) => new Promise((resolve, reject) => {
  const contract = getBuolasContract(window.MODAL_PROVIDER, chainId);

  const fn = contract.methods.withdraw().send({ from: account });

  sendTransaction(fn, account)
    .then((response) => resolve(response?.transactionHash))
    .catch((e) => {
      window.console.log('Error occured on withdrawing buOlas balance');
      reject(e);
    });
});

/**
 * Revoke buOlas from owner accout
 */
export const revokeRequest = ({ account, chainId }) => new Promise((resolve, reject) => {
  const contract = getBuolasContract(window.MODAL_PROVIDER, chainId);

  const fn = contract.methods
    .revoke([SIGNER_ADDRESS])
    .send({ from: account });

  sendTransaction(fn, account)
    .then((response) => resolve(response?.transactionHash))
    .catch((e) => {
      window.console.log('Error occured on revoking buOlas');
      reject(e);
    });
});
