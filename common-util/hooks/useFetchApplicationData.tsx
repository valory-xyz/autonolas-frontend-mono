import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { getTweetsList } from 'common-util/api';
import { getLeaderboardList } from 'common-util/api/leaderboard';
import { getModuleDetails } from 'common-util/api/moduleDetails';
import {
  setIsLeaderboardLoading,
  setIsModuleDetailsLoading,
  setIsTweetsLoading,
  setLeaderboard,
  setModuleDetails,
  setTweets,
} from 'store/setup';

/**
 * Hook to concurrently fetch application data (leaderboard, tweets, and module details) on page load
 */
export const useFetchApplicationData = () => {
  const dispatch = useDispatch();

  const fetchLeaderboard = useCallback(async () => {
    try {
      dispatch(setIsLeaderboardLoading(true));
      const list = await getLeaderboardList();
      dispatch(setLeaderboard(list));
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(setIsLeaderboardLoading(false));
    }
  }, [dispatch]);

  const fetchTweets = useCallback(async () => {
    try {
      dispatch(setIsTweetsLoading(true));
      const list = await getTweetsList();
      dispatch(setTweets(list));
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(setIsTweetsLoading(false));
    }
  }, [dispatch]);

  const fetchModuleDetails = useCallback(async () => {
    try {
      dispatch(setIsModuleDetailsLoading(true));
      const moduleDetails = await getModuleDetails();
      dispatch(setModuleDetails(moduleDetails));
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(setIsModuleDetailsLoading(false));
    }
  }, [dispatch]);

  const fetchApplicationData = useCallback(async () => {
    await Promise.all([fetchLeaderboard(), fetchTweets(), fetchModuleDetails()]);
  }, [fetchLeaderboard, fetchTweets, fetchModuleDetails]);

  useEffect(() => {
    fetchApplicationData();
  }, [fetchApplicationData]);
};
