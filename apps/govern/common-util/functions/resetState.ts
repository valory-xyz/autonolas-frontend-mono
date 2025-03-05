import { ActionCreatorWithoutPayload } from '@reduxjs/toolkit';
import { queryClient } from 'context/Web3ModalProvider';
import { clearState } from 'store/govern';
import { AppDispatch } from 'store/index';

// Reset previously saved data so it's re-fetched automatically
export const resetState = (
  keys: string[],
  dispatch: AppDispatch,
  clearAction: ActionCreatorWithoutPayload<
    'govern/clearState' | 'govern/clearUserState'
  > = clearState,
) => {
  queryClient.removeQueries({
    predicate: (query) =>
      keys.includes(
        // `query.queryKey[0]` is just the name of the function that initiate the query cache, e.g "readContract"
        // while `query.queryKey[1]` has query arguments, including scopeKey if provided
        (query.queryKey[1] as Record<string, string>)?.scopeKey,
      ),
  });
  dispatch(clearAction());
};
