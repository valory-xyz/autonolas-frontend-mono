import PropTypes from 'prop-types';
import React from 'react';
import { Card } from 'antd';

import { getBlockchainShortsAddress } from '../../common-util/Contracts';

const VideoCard = ({
  id,
  videoHash,
  // imageHash,
  prompt,
}) => {
  const videoUrl = `https://${process.env.NEXT_PUBLIC_REGISTRY_URL}/${videoHash}`;
  // const imageUrl = `https://${process.env.NEXT_PUBLIC_REGISTRY_URL}/${imageHash}`;
  const scanUrl = getBlockchainShortsAddress(id);

  return (
    <Card
      hoverable
      // cover={<img alt="Video thumbnail" src={imageUrl} />}
    >
      <Card.Meta
        title={
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={videoUrl} controls />
        }
        description={
          <>
            <div>{prompt}</div>
            <a href={scanUrl} target="_blank" rel="noopener noreferrer">
              NFT
            </a>
          </>
        }
      />
    </Card>
  );
};

VideoCard.propTypes = {
  videoHash: PropTypes.string.isRequired, // or PropTypes.array if it's not required
  // imageHash: PropTypes.string.isRequired, // or PropTypes.array if it's not required
  prompt: PropTypes.string.isRequired, // or PropTypes.array if it's not required
  id: PropTypes.number.isRequired,
};

export default VideoCard;
