import { CloseCircleOutlined } from '@ant-design/icons';
import { Col, Row } from 'antd';
import PropTypes from 'prop-types';
import { Fragment, useMemo } from 'react';

import type { TweetOrThread } from '.';
import { Media, MediaDeleteButton, MediaWrapper } from './styles';
import { getMediaSrc } from './utils';

export const MODE = {
  VIEW: 'view',
  EDIT: 'edit',
};

type MediaItem = {
  name: string;
  type: string;
  size: number;
  url?: string;
};

type MediaItemProps = {
  mode?: typeof MODE.VIEW | typeof MODE.EDIT;
  item: string | MediaItem | TweetOrThread['media'][number];
  handleDelete?: (item: string | MediaItem) => void;
};

const MediaItem = ({ mode = MODE.EDIT, item, handleDelete }: MediaItemProps) => {
  const src = useMemo(() => {
    try {
      if (typeof item === 'string') {
        return getMediaSrc(item);
      }
      return URL.createObjectURL(item as TweetOrThread['media'][number]);
    } catch {
      return '';
    }
  }, [item]);

  const Wrapper = mode === MODE.EDIT ? MediaWrapper : Fragment;

  const handleDeleteAndRevoke = () => {
    if (handleDelete) {
      handleDelete(item);
      if (typeof item === 'object' && item?.url) {
        URL.revokeObjectURL(item.url);
      }
    }
  };

  return (
    <Col>
      <Wrapper>
        <Media
          src={src}
          width={mode === MODE.EDIT ? 80 : 30}
          height={mode === MODE.EDIT ? 80 : 30}
        />
      </Wrapper>
      {mode === MODE.EDIT && (
        <MediaDeleteButton
          type="default"
          shape="circle"
          size="small"
          onClick={handleDeleteAndRevoke}
        >
          <CloseCircleOutlined />
        </MediaDeleteButton>
      )}
    </Col>
  );
};

type MediaListProps = {
  media: MediaItemProps['item'][];
  handleDelete?: MediaItemProps['handleDelete'];
  mode?: MediaItemProps['mode'];
  className?: string;
};

const MediaList = ({ media, handleDelete, mode = MODE.EDIT, className = '' }: MediaListProps) => {
  if (media.length === 0) return null;

  return (
    <Row gutter={[12, 12]} className={className}>
      {media.map((item) => {
        const key = typeof item === 'string' ? item : item.name;
        return <MediaItem key={key} item={item} mode={mode} handleDelete={handleDelete} />;
      })}
    </Row>
  );
};

export default MediaList;
