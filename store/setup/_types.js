const reducerName = 'Setup';

export const apiTypes = {
  GET_API: `${reducerName}/Get API`,
};

export const syncTypes = {
  SET_ACCOUNT: `${reducerName}/Set account`,
  SET_BALANCE: `${reducerName}/Set balance`,
  SET_CHAIND_ID: `${reducerName}/Set chain id`,
  SET_LOGIN_ERROR: `${reducerName}/Set error`,
  SET_LOGOUT: `${reducerName}/Set logout`,

  // OLAS
  SET_OLAS_BALANCE: `${reducerName}/OLAS - balance`,

  // veOlas
  SET_VEOLAS_BALANCEOF: `${reducerName}/Set veOlas - balanceOf`,
  SET_MAPPED_BALANCES: `${reducerName}/Set veOlas - mapped balances`,
  SET_VOTES: `${reducerName}/Set veOlas - votes`,
  SET_TOTAL_SUPPLY_LOCKED: `${reducerName}/Set veOlas - total supply locked`,
  SET_CAN_WITHDRAW_VEOLAS: `${reducerName}/Set veOlas - can withdraw veOlas`,

  // buOlas
  SET_BUOLAS_BALANCEOF: `${reducerName}/Set buOlas - balanceOf`,
  SET_BUOLAS_LOCKED_END: `${reducerName}/Set buOlas - locked end`,
  SET_BUOLAS_RELEASABLE_AMOUNT: `${reducerName}/Set buOlas - releasable amount`,
  SET_BUOLAS_MAPPED_BALANCES: `${reducerName}/Set buOlas - mapped balance`,

  SET_STORE_STATE: `${reducerName}/Set Store State`,
};
