import type { ContributeModuleDetails, ScheduledTweet } from 'types/moduleDetails';
import type { ContributeTweet } from 'types/tweets';

export const getTweetsList = async () => {
  const response = await fetch('/api/tweets');
  const json: ContributeTweet[] = await response.json();
  const tweetsList: ContributeTweet['json_value'][] = [];

  // TODO: consider convenient mapping right inside the api endpoint
  if (json && Array.isArray(json)) {
    json.forEach((tweet) => {
      tweetsList.push(tweet.json_value);
    });
  }

  return tweetsList;
};

export const proposePost = async (
  post: ScheduledTweet,
  attributeId: number,
): Promise<ContributeModuleDetails> => {
  const response = await fetch('/api/post', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ post, attributeId, isPostProposal: true }),
  });

  return await response.json();
};

export const approveOrExecutePost = async (
  post: ScheduledTweet,
  attributeId: number,
): Promise<ContributeModuleDetails> => {
  const response = await fetch('/api/post', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ post, attributeId, isPostProposal: false }),
  });

  return await response.json();
};
