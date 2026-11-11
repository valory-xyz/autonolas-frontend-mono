import type { Address } from 'viem';

import { clearState, governReducer, setPendingClaim, setStakingContracts } from './govern';

const ACCOUNT: Address = '0x00000000000000000000000000000000000000aa';

describe('govern slice', () => {
  it('keeps the pending claims through clearState, and resets everything else', () => {
    const initial = governReducer(undefined, { type: 'init' });
    let state = governReducer(initial, setStakingContracts([]));
    state = governReducer(
      state,
      setPendingClaim({ account: ACCOUNT, pending: { status: 'waiting', hash: '0xhash' } }),
    );

    const cleared = governReducer(state, clearState());

    expect(cleared.pendingClaims[ACCOUNT]).toEqual({ status: 'waiting', hash: '0xhash' });
    expect({ ...cleared, pendingClaims: {} }).toEqual(initial);
  });

  it('forgets a pending claim set to null', () => {
    let state = governReducer(
      undefined,
      setPendingClaim({ account: ACCOUNT, pending: { status: 'sending' } }),
    );
    state = governReducer(state, setPendingClaim({ account: ACCOUNT, pending: null }));

    expect(state.pendingClaims).toEqual({});
  });
});
