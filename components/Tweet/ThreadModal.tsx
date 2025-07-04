import { PlusOutlined, XOutlined } from '@ant-design/icons';
import { Button, Col, Input, Modal, Row, message } from 'antd';
import React, { useState } from 'react';

import { MAX_TWEET_IMAGES, MAX_TWEET_LENGTH } from 'util/constants';

import type { TweetOrThread } from '.';
import MediaList from './MediaList';
import TweetLength from './TweetLength';
import UploadButton from './UploadButton';
import { ViewThread } from './ViewThread';
import { ProposalCountRow } from './styles';

type ThreadModalProps = {
  firstTweetInThread: string;
  firstMediaInThread: TweetOrThread['media'];
  isSubmitting: boolean;
  addThread: (thread: TweetOrThread) => Promise<void>;
  closeThreadModal: () => void;
};

const ThreadModal = ({
  firstTweetInThread,
  firstMediaInThread,
  isSubmitting,
  addThread,
  closeThreadModal,
}: ThreadModalProps) => {
  const [thread, setThread] = useState([{ text: firstTweetInThread, media: firstMediaInThread }]);
  const [tweet, setTweet] = useState<string>('');
  const [media, setMedia] = useState<TweetOrThread['media']>([]);

  // index of the tweet currently being edited,
  // null if no tweet is being edited
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number | null>(null);

  const onAddToThread = () => {
    if ((!tweet || tweet.trim() === '') && media.length === 0) {
      message.error('Tweet cannot be empty.');
      return;
    }

    const newThread = [...thread];

    // currently editing a thread
    if (currentEditingIndex === null) {
      newThread.push({ text: tweet, media });
    } else {
      newThread[currentEditingIndex] = { text: tweet, media };
    }

    setThread(newThread);
    setTweet('');
    setMedia([]);
    setCurrentEditingIndex(null);
  };

  const onEditThread = (threadIndex: number) => {
    setTweet(thread[threadIndex]?.text ?? '');
    setMedia(thread[threadIndex]?.media ?? []);
    setCurrentEditingIndex(threadIndex);
  };

  // REMOVE the tweet from the thread
  const onRemoveFromThread = (threadIndex: number) => {
    const newThread = [...thread];
    newThread.splice(threadIndex, 1);
    setThread(newThread);

    // If the thread is being edited - clear all fields
    // to avoid incorrect saving
    if (currentEditingIndex === threadIndex) {
      setTweet('');
      setMedia([]);
      setCurrentEditingIndex(null);
    }
  };

  // POST the thread to the backend
  const onPostThread = async () => {
    if (thread.some((t) => (t.text || '').trim() === '' && t.media.length === 0)) {
      message.error('One or more posts are empty. Please fill them all.');
      return;
    }

    // Add latest changes to the thread as it's more intuitive to click
    // propose without saving the changes
    if ((tweet || '').trim() !== '' || media.length !== 0) {
      onAddToThread();
    }

    try {
      // post the thread & close the modal
      await addThread({
        text: thread.map((item) => item.text ?? ''),
        media: thread.flatMap((item) => item.media),
      });

      closeThreadModal();
    } catch (error) {
      message.error('Something went wrong. Please try again.');
    }
  };

  return (
    <Modal
      open
      title="X Thread"
      width={900}
      onOk={onPostThread}
      onCancel={closeThreadModal}
      footer={[
        <Button
          key="submit"
          type="primary"
          loading={isSubmitting}
          onClick={onPostThread}
          icon={<XOutlined />}
        >
          Propose thread
        </Button>,
      ]}
    >
      <Row gutter={24}>
        <Col md={12} xs={24}>
          <Input.TextArea
            className="mt-24 mb-12"
            placeholder="Compose your thread..."
            rows={4}
            value={tweet}
            maxLength={MAX_TWEET_LENGTH}
            onChange={(e) => setTweet(e.target.value)}
          />

          <MediaList
            media={media}
            handleDelete={(removingFile) =>
              setMedia((prev) => prev.filter((file) => file !== removingFile))
            }
          />

          <ProposalCountRow>
            <TweetLength tweet={tweet} />
            <Row className="mt-12" gutter={[8, 8]}>
              <Col>
                <UploadButton
                  disabled={media.length >= MAX_TWEET_IMAGES}
                  onUploadMedia={(newMedia) => setMedia((prev) => [...prev, newMedia])}
                />
              </Col>
              <Col>
                <Button
                  type="primary"
                  ghost
                  onClick={onAddToThread}
                  disabled={(tweet || '').trim() === '' && media.length === 0}
                >
                  <PlusOutlined />
                  {currentEditingIndex === null ? 'Add to thread' : 'Edit thread'}
                </Button>
              </Col>
            </Row>
          </ProposalCountRow>
        </Col>

        <Col md={12} xs={24} style={{ maxHeight: '400px', minHeight: '300px', overflow: 'auto' }}>
          <ViewThread
            thread={thread}
            onEditThread={onEditThread}
            onRemoveFromThread={onRemoveFromThread}
          />
        </Col>
      </Row>
    </Modal>
  );
};

export default ThreadModal;
