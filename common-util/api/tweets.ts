import { ContributeTweet } from 'types/tweets';

export const getTweetsList = async () => {
  const response = await fetch('/api/tweets');
  const json: ContributeTweet[] = await response.json();
  const tweetsList: ContributeTweet['json_value'][] = [];

  if (json && Array.isArray(json)) {
    json.forEach((tweet) => {
      tweetsList.push(tweet.json_value);
    });
  }

  return tweetsList;
};
