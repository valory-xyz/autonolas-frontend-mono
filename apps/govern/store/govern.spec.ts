import type { Address } from 'viem';

import { clearState, governReducer, setPendingClaim, setStakingContracts } from './govern';

const ACCOUNT: Address = '0x00000000000000000000000000000000000000aa';
const OTHER: Address = '0x00000000000000000000000000000000000000bb';

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
      setPendingClaim({ account: ACCOUNT, pending: { status: 'sending', run: 1 } }),
    );
    state = governReducer(state, setPendingClaim({ account: ACCOUNT, pending: null }));

    expect(state.pendingClaims).toEqual({});
  });

  it('sets and clears one account without touching another', () => {
    const waiting = { status: 'waiting', hash: '0xother' } as const;
    let state = governReducer(undefined, setPendingClaim({ account: OTHER, pending: waiting }));
    state = governReducer(
      state,
      setPendingClaim({ account: ACCOUNT, pending: { status: 'preparing', run: 1 } }),
    );
    expect(state.pendingClaims).toEqual({
      [OTHER]: waiting,
      [ACCOUNT]: { status: 'preparing', run: 1 },
    });

    state = governReducer(state, setPendingClaim({ account: ACCOUNT, pending: null }));

    expect(state.pendingClaims).toEqual({ [OTHER]: waiting });
  });
});
