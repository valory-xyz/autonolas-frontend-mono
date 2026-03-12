import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { approveOrExecutePost, proposePost } from 'common-util/api';
import { setModuleDetails, useAppSelector } from 'store/setup';
import type { ScheduledTweet } from 'types/moduleDetails';

export const useModuleUtilities = () => {
  const { moduleDetails, moduleDetailsAttributeId, isModuleDetailsLoading } = useAppSelector(
    (state) => state.setup,
  );
  const dispatch = useDispatch();

  const submitPostProposal = useCallback(
    async (post: ScheduledTweet) => {
      const response = await proposePost(post, moduleDetailsAttributeId!);
      dispatch(setModuleDetails(response.json_value));
    },
    [moduleDetailsAttributeId, dispatch],
  );

  const submitApprovedOrExecutedPost = useCallback(
    async (post: ScheduledTweet) => {
      const response = await approveOrExecutePost(post, moduleDetailsAttributeId!);
      dispatch(setModuleDetails(response.json_value));
    },
    [moduleDetailsAttributeId, dispatch],
  );

  return {
    moduleDetails,
    isModuleDetailsLoading,
    moduleDetailsAttributeId,
    submitPostProposal,
    submitApprovedOrExecutedPost,
  };
};
