import { CloseOutlined, EditFilled } from '@ant-design/icons';
import { Button, Timeline, Typography } from 'antd';
import { Fragment } from 'react';

import { NA } from '@autonolas/frontend-library';

import type { TweetOrThread } from '.';
import MediaList, { MODE } from './MediaList';
import { EachThreadContainer } from './styles';

const { Text } = Typography;

type ViewThreadProps = {
  thread: {
    text: string | string[];
    media: (string | TweetOrThread['media'][number])[];
  }[];
  onEditThread?: (threadIndex: number) => void;
  onRemoveFromThread?: (threadIndex: number) => void;
};

export const ViewThread = ({ thread, onEditThread, onRemoveFromThread }: ViewThreadProps) => (
  <Timeline
    style={{ paddingTop: 10 }}
    items={thread.map((tweet, threadIndex) => ({
      children: (
        <Fragment key={`thread-${threadIndex}`}>
          <EachThreadContainer>
            <Text style={{ whiteSpace: 'pre-wrap' }}>{tweet.text || NA}</Text>

            <div className="thread-col-2">
              {onEditThread && (
                <Button
                  ghost
                  type="primary"
                  size="small"
                  icon={<EditFilled />}
                  onClick={() => onEditThread(threadIndex)}
                />
              )}

              {(tweet.text?.length > 1 || tweet.media.length > 0) && onRemoveFromThread && (
                <Button
                  danger
                  className="ml-8"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => onRemoveFromThread(threadIndex)}
                />
              )}
            </div>
          </EachThreadContainer>
          <MediaList media={tweet.media} mode={MODE.VIEW} className="mt-8" />
        </Fragment>
      ),
    }))}
  />
);
