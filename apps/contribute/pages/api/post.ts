import { cloneDeep, omit } from 'lodash';
import type { NextApiRequest, NextApiResponse } from 'next';
import { MODULE_DETAILS_API_BASE_URL } from 'pages/api/module-details';

import { getSignature } from 'common-util/apiRoute';
import { getNowTimestamp } from 'common-util/functions/time';
import type { ContributeModuleDetails, ScheduledTweet } from 'types/moduleDetails';

const AGENT_TYPE = process.env.AGENT_TYPE_ID;

const ENDPOINT_URL = '/api/agent-attributes';
const BASE_URL = `${process.env.NEXT_PUBLIC_AFMDB_URL}${ENDPOINT_URL}`;
const ERROR_MESSAGE = 'Failed to update agent attributes.';

const getLatestModuleDetails = async () => {
  // fetch latest module data
  const moduleDetailsResponse = await fetch(MODULE_DETAILS_API_BASE_URL);
  const moduleDetails: ContributeModuleDetails[] = await moduleDetailsResponse.json();
  return moduleDetails;
};

const getUpdatedModuleDetailsOnPostProposal = async (post: ScheduledTweet) => {
  const moduleDetails = await getLatestModuleDetails();
  const updatedModuleDetails = cloneDeep(moduleDetails);
  const existingTweets = updatedModuleDetails[0].json_value.scheduled_tweet.tweets;
  updatedModuleDetails[0].json_value.scheduled_tweet.tweets = [...existingTweets, post];

  return updatedModuleDetails;
};

const getUpdatedModuleDetailsAfterPostMutation = async (post: ScheduledTweet) => {
  const moduleDetails = await getLatestModuleDetails();
  const updatedModuleDetails = cloneDeep(moduleDetails);
  const updatedTweets = updatedModuleDetails[0].json_value.scheduled_tweet.tweets.map((tweet) =>
    tweet.request_id === post.request_id ? post : tweet,
  );
  updatedModuleDetails[0].json_value.scheduled_tweet.tweets = updatedTweets;

  return updatedModuleDetails;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PUT') {
      res.status(405).end();
      return;
    }
    const { post, attributeId, isPostProposal } = req.body;

    /**
     * Update module details depending whether it's a
     * new post proposal or an old post has been approved/executed
     */
    const moduleDetails = isPostProposal
      ? await getUpdatedModuleDetailsOnPostProposal(post)
      : await getUpdatedModuleDetailsAfterPostMutation(post);

    const message = `timestamp:${getNowTimestamp()},endpoint:${ENDPOINT_URL}/${attributeId}`;
    const signature = await getSignature(message);

    const response = await fetch(`${BASE_URL}/${attributeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_attr: omit(moduleDetails[0], ['last_updated', 'attribute_id']),
        auth: {
          agent_id: AGENT_TYPE,
          signature,
          message,
        },
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: ERROR_MESSAGE });
    }

    const responseJson: ContributeModuleDetails = await response.json();
    res.status(200).json(responseJson);
  } catch (error) {
    res.status(500).json({ error: ERROR_MESSAGE });
  }
}
