import { formatToEth, getBlockTimestamp } from 'common-util/functions';
import {
  getVeolasContract, getOlasContract, getBuolasContract,
} from 'common-util/Contracts';
import { getNextReleasableAmount } from './utils';
import { syncTypes } from './_types';

export const setUserAccount = (account) => ({
  type: syncTypes.SET_ACCOUNT,
  data: { account },
});

export const setUserBalance = (balance) => ({
  type: syncTypes.SET_BALANCE,
  data: { balance },
});

export const setChainId = (chainId) => ({
  type: syncTypes.SET_CHAIND_ID,
  data: { chainId },
});

export const setErrorMessage = (errorMessage) => ({
  type: syncTypes.SET_LOGIN_ERROR,
  data: { errorMessage },
});

export const setLogout = () => ({
  type: syncTypes.SET_LOGOUT,
  data: {},
});

// olas
export const fetchOlasBalance = () => async (dispatch, getState) => {
  const account = getState()?.setup?.account;
  const chainId = getState()?.setup?.chainId;

  try {
    const contract = getOlasContract(window.MODAL_PROVIDER, chainId);
    const response = await contract.methods
      .balanceOf(account)
      .call();

    dispatch({
      type: syncTypes.SET_OLAS_BALANCE,
      data: { olasBalance: response },
    });
  } catch (error) {
    console.error(error);
  }
};

// veOlas
/**
 * balanceOf veOlas contract - it is the amount of veolas locked
 */
export const fetchVeolasBalance = () => async (dispatch, getState) => {
  const account = getState()?.setup?.account;
  const chainId = getState()?.setup?.chainId;

  try {
    const contract = getVeolasContract(window.MODAL_PROVIDER, chainId);
    const response = await contract.methods
      .balanceOf(account)
      .call();

    dispatch({
      type: syncTypes.SET_VEOLAS_BALANCEOF,
      data: { lockedVeolas: formatToEth(response) },
    });
  } catch (error) {
    console.error(error);
  }
};

export const setMappedBalances = (data) => ({
  type: syncTypes.SET_MAPPED_BALANCES,
  data,
});

export const fetchMappedBalances = () => async (dispatch, getState) => {
  const account = getState()?.setup?.account;
  const chainId = getState()?.setup?.chainId;

  try {
    const contract = getVeolasContract(window.MODAL_PROVIDER, chainId);
    const response = await contract.methods
      .mapLockedBalances(account)
      .call();

    dispatch({
      type: syncTypes.SET_MAPPED_BALANCES,
      data: {
        amount: formatToEth(response.amount),
        endTime: response.endTime * 1000, // multiplied by 1000 to convert to milliseconds
      },
    });
  } catch (error) {
    console.error(error);
  }
};

export const fetchVotes = () => async (dispatch, getState) => {
  const account = getState()?.setup?.account;
  const chainId = getState()?.setup?.chainId;

  try {
    const contract = getVeolasContract(window.MODAL_PROVIDER, chainId);
    const response = await contract.methods
      .getVotes(account)
      .call();

    dispatch({
      type: syncTypes.SET_VOTES,
      data: { votes: response },
    });
  } catch (error) {
    console.error(error);
  }
};

export const fetchTotalSupplyLocked = () => async (dispatch, getState) => {
  const chainId = getState()?.setup?.chainId;

  try {
    const contract = getVeolasContract(window.MODAL_PROVIDER, chainId);
    const response = await contract.methods
      .totalSupplyLocked()
      .call();

    dispatch({
      type: syncTypes.SET_TOTAL_SUPPLY_LOCKED,
      data: { totalSupplyLocked: response },
    });
  } catch (error) {
    console.error(error);
  }
};

export const fetchVeolasDetails = () => async (dispatch) => {
  dispatch(fetchOlasBalance());
  dispatch(fetchVeolasBalance());
  dispatch(fetchVotes());
  dispatch(fetchTotalSupplyLocked());
};

export const fetchIfCanWithdrawVeolas = () => async (dispatch, getState) => {
  const account = getState()?.setup?.account;
  const chainId = getState()?.setup?.chainId;

  try {
    const contract = getVeolasContract(window.MODAL_PROVIDER, chainId);
    const balance = await contract.methods
      .balanceOf(account)
      .call();

    const lockedEnd = await contract.methods
      .lockedEnd(account)
      .call();

    const blockNumber = await window?.WEB3_PROVIDER.eth.getBlockNumber();
    const blockTimestamp = await getBlockTimestamp(blockNumber);
    const canWithdrawVeolas = Number(balance) > 0 && lockedEnd <= blockTimestamp;

    dispatch({
      type: syncTypes.SET_CAN_WITHDRAW_VEOLAS,
      data: { canWithdrawVeolas },
    });
  } catch (error) {
    console.error(error);
  }
};

// buOlas
export const fetchBuolasBalance = () => async (dispatch, getState) => {
  const account = getState()?.setup?.account;
  const chainId = getState()?.setup?.chainId;

  try {
    const contract = getBuolasContract(window.MODAL_PROVIDER, chainId);
    const response = await contract.methods
      .balanceOf(account)
      .call();

    dispatch({
      type: syncTypes.SET_BUOLAS_BALANCEOF,
      data: { buolasBalance: formatToEth(response) },
    });
  } catch (error) {
    console.error(error);
  }
};

export const fetchReleasableAmount = () => async (dispatch, getState) => {
  const account = getState()?.setup?.account;
  const chainId = getState()?.setup?.chainId;

  try {
    const contract = getBuolasContract(window.MODAL_PROVIDER, chainId);
    const response = await contract.methods
      .releasableAmount(account)
      .call();

    dispatch({
      type: syncTypes.SET_BUOLAS_RELEASABLE_AMOUNT,
      data: { buolasReleasableAmount: formatToEth(response) },
    });
  } catch (error) {
    window.console.log('Error occured on fetching buOlas ReleasableAmount');
    console.error(error);
  }
};

export const fetchMapLockedBalances = () => async (dispatch, getState) => {
  const account = getState()?.setup?.account;
  const chainId = getState()?.setup?.chainId;

  try {
    const contract = getBuolasContract(window.MODAL_PROVIDER, chainId);
    const response = await contract.methods
      .mapLockedBalances(account)
      .call();

    const blockTimestamp = await getBlockTimestamp();

    const tempResponse = { ...response };
    const nextValues = getNextReleasableAmount(tempResponse, blockTimestamp);

    dispatch({
      type: syncTypes.SET_BUOLAS_MAPPED_BALANCES,
      data: {
        // multiplied by 1000 to convert to milliseconds
        buolasMappedBalances: {
          amount: formatToEth(response.totalAmount),
          startTime: response.startTime * 1000,
          endTime: response.endTime * 1000,
          transferredAmount: formatToEth(response.transferredAmount),
        },
        ...nextValues,
      },
    });
  } catch (error) {
    window.console.log('Error occured on fetching buOlas MapLockedBalances');
    console.error(error);
  }
};

export const fetchLockedEnd = () => async (dispatch, getState) => {
  const account = getState()?.setup?.account;
  const chainId = getState()?.setup?.chainId;

  try {
    const contract = getBuolasContract(window.MODAL_PROVIDER, chainId);
    const response = await contract.methods
      .lockedEnd(account)
      .call();

    dispatch({
      type: syncTypes.SET_BUOLAS_LOCKED_END,
      // multiplied by 1000 to convert to milliseconds
      data: { buolasLockedEnd: response * 1000 },
    });
  } catch (error) {
    window.console.log('Error occured on fetching buOlas lockedEnd');
    console.error(error);
  }
};

export const fetchBuolasDetails = () => async (dispatch) => {
  dispatch(fetchOlasBalance());
  dispatch(fetchBuolasBalance());
  dispatch(fetchReleasableAmount());
  dispatch(fetchMapLockedBalances());
  dispatch(fetchLockedEnd());
};
